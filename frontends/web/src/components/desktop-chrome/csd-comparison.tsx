// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { runningInQtWebEngine } from '@/utils/env';
import { getQtChannel } from '@/utils/transport-qt';
import './csd-comparison.module.css';

type TRect = { x: number; y: number; width: number; height: number };
type TState = {
  csd: boolean;
  document: number;
  viewport: number;
  cornerRadius: number;
  captionButtons: (TRect & { action: string })[];
};
type TChrome = {
  state: TState;
  stateChanged: {
    connect: (callback: () => void) => void;
    disconnect: (callback: () => void) => void;
  };
  updateFrame: (value: unknown, applied: () => void) => void;
  prepareStartup: (document: number) => void;
};

let sequence = 0;

const qtColor = (value: string) => {
  const channels = value.match(/^rgba?\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/);
  return channels ? '#' + channels.slice(1, 4).map(channel => Number(channel).toString(16).padStart(2, '0')).join('') : value;
};

// Comparison-only plumbing: report existing header geometry without changing
// its layout, scroll ownership, spacing, overlays, or appearance preferences.
export const CsdComparison = () => {
  const { t } = useTranslation();
  useEffect(() => {
    if (!runningInQtWebEngine()) {
      return;
    }
    let disposed = false;
    let cleanup: (() => void) | undefined;
    getQtChannel().then(channel => {
      if (disposed) {
        return;
      }
      const chrome = channel.objects.desktopChrome as TChrome | undefined;
      if (!chrome) {
        return;
      }
      let frame: number | undefined;
      let previous = '';
      let inFlight = false;
      let resample = false;
      let preparedDocument: number | undefined;
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < window.innerWidth &&
          style.visibility !== 'hidden';
      };
      const rect = (element: Element): TRect => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      };
      const publish = () => {
        frame = undefined;
        if (disposed) {
          return;
        }
        if (inFlight) {
          resample = true; return;
        }
        const state = chrome.state;
        if (!state.csd) {
          return;
        }
        const headers = [...document.querySelectorAll('[data-csd-comparison-header]')].filter(visible);
        const height = Math.min(256, Math.max(70, ...headers.map(header => header.getBoundingClientRect().bottom)));
        const exclusions = [...document.querySelectorAll('button, input, select, textarea, a, [role="button"], [data-csd-comparison-control]')]
          .filter(element => visible(element) && element.getBoundingClientRect().top < height &&
            element.getBoundingClientRect().bottom > 0)
          .map(rect);
        const app = document.querySelector('.app') || document.body;
        const style = getComputedStyle(app);
        const rootStyle = getComputedStyle(document.documentElement);
        const token = rootStyle.getPropertyValue('--radius-xl').trim();
        const buttonRadius = parseFloat(token) * (token.endsWith('rem') ? parseFloat(rootStyle.fontSize) : 1);
        const captionColors = Object.fromEntries((state.captionButtons || []).map(button => {
          const element = document.elementFromPoint(button.x + button.width / 2, button.y + button.height / 2);
          return [button.action, qtColor(element ? getComputedStyle(element).color : style.color)];
        }));
        const value = {
          layout: {
            document: state.document, viewport: state.viewport,
            size: { width: window.innerWidth, height: window.innerHeight },
            titlebar: { x: 0, y: 0, width: window.innerWidth, height },
            exclusions,
          },
          appearance: {
            background: qtColor(style.backgroundColor), foreground: qtColor(style.color),
            buttonRadius, captionColors,
            labels: {
              close: t('desktopChrome.close'), maximize: t('desktopChrome.maximize'),
              minimize: t('desktopChrome.minimize'),
            },
          },
        };
        const key = JSON.stringify(value);
        if (key === previous) {
          return;
        }
        previous = key;
        inFlight = true;
        chrome.updateFrame({ ...value, layout: { ...value.layout, sequence: ++sequence } }, () => {
          inFlight = false;
          if (disposed) {
            return;
          }
          if (preparedDocument !== state.document && chrome.state.document === state.document) {
            preparedDocument = state.document;
            chrome.prepareStartup(state.document);
          }
          if (resample) {
            resample = false; schedule();
          }
        });
      };
      const schedule = () => {
        if (!disposed && frame === undefined) {
          frame = requestAnimationFrame(publish);
        }
      };
      const changed = () => {
        const state = chrome.state;
        document.documentElement.toggleAttribute('data-csd-comparison', state.csd);
        document.body.toggleAttribute('data-csd-comparison', state.csd);
        const radius = `${state.cornerRadius}px`;
        if (document.body.style.getPropertyValue('--csd-comparison-radius') !== radius) {
          document.body.style.setProperty('--csd-comparison-radius', radius);
        }
        schedule();
      };
      const mutations = new MutationObserver(schedule);
      mutations.observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
      const resize = new ResizeObserver(schedule);
      resize.observe(document.body);
      const events = ['resize', 'transitionend'];
      events.forEach(event => window.addEventListener(event, schedule, true));
      chrome.stateChanged.connect(changed);
      changed();
      document.fonts.ready.then(schedule);
      cleanup = () => {
        chrome.stateChanged.disconnect(changed);
        if (frame !== undefined) {
          cancelAnimationFrame(frame);
        }
        mutations.disconnect();
        resize.disconnect();
        events.forEach(event => window.removeEventListener(event, schedule, true));
        document.documentElement.removeAttribute('data-csd-comparison');
        document.body.removeAttribute('data-csd-comparison');
        document.body.style.removeProperty('--csd-comparison-radius');
      };
    });
    return () => {
      disposed = true; cleanup?.();
    };
  }, [t]);
  return null;
};
