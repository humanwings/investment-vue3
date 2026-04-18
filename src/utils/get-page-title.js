const defaultTitle = import.meta.env.VITE_APP_TITLE || 'investment-front-vue3'

export default function getPageTitle(pageTitle) {
  return pageTitle ? `${pageTitle} - ${defaultTitle}` : defaultTitle
}
