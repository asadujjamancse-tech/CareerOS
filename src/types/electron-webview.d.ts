declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string
        allowpopups?: string
        nodeintegration?: string
        partition?: string
        useragent?: string
        disablewebsecurity?: string
      }
    }
  }
}
