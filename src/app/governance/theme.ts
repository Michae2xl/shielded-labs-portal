/** The governance portal's light theme: chosen with the sun and moon in a corner, kept in this browser only. */
export const THEME_KEY = 'governance-theme';
export const THEME_EVENT = 'governance:theme';

/**
 * Runs before the page paints, so the page never flashes the other theme: the visitor's own choice when saved,
 * otherwise the theme their system asks for.
 */
export const THEME_SCRIPT = `(function(){var s=null;try{s=localStorage.getItem('${THEME_KEY}')}catch(e){}try{if(s==='light'||(s!=='dark'&&typeof matchMedia==='function'&&matchMedia('(prefers-color-scheme: light)').matches))document.documentElement.dataset.govTheme='light'}catch(e){}})()`;
