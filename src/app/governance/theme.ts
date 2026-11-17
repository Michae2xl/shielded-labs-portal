/** The governance portal's light theme: chosen with the sun and moon in a corner, kept in this browser only. */
export const THEME_KEY = 'governance-theme';
export const THEME_EVENT = 'governance:theme';

/** Runs before the page paints, so a saved light theme never flashes dark. */
export const THEME_SCRIPT = `try{if(localStorage.getItem('${THEME_KEY}')==='light')document.documentElement.dataset.govTheme='light'}catch(e){}`;
