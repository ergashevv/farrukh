import AOS from 'aos';

/** AOS.init faqat bir marta — har `init` yangi scroll listener qo‘shadi (jank). */
let siteAosInitialized = false;

const INIT = {
  duration: 720,
  easing: 'ease-out-sine',
  once: true,
  offset: 52,
  anchorPlacement: 'top-bottom',
  startEvent: 'DOMContentLoaded',
  throttleDelay: 64,
  debounceDelay: 44,
  disableMutationObserver: false,
};

export function ensureSiteAosInitialized() {
  if (siteAosInitialized) return;
  AOS.init(INIT);
  siteAosInitialized = true;
}

/** DOM yangilangandan keyin pozitsiyalarni qayta hisoblash (React re-render, reorder). */
export function syncSiteAos() {
  if (!siteAosInitialized) return;
  AOS.refreshHard();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      AOS.refresh();
    });
  });
}
