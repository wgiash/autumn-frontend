// Keep inline: the stylesheet pipeline drops backdrop-filter from imported CSS.
export const DIALOG_BACKDROP_CSS =
  ".figures-dialog::backdrop{-webkit-backdrop-filter:blur(0px);backdrop-filter:blur(0px);transition:background 200ms ease,-webkit-backdrop-filter 200ms ease,backdrop-filter 200ms ease,overlay 200ms allow-discrete,display 200ms allow-discrete}" +
  ".figures-dialog[open]::backdrop{-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}" +
  "@starting-style{.figures-dialog[open]::backdrop{-webkit-backdrop-filter:blur(0px);backdrop-filter:blur(0px)}}";
