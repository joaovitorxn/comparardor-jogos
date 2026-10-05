import { renderAppIcon } from "@/lib/app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// o iOS arredonda os cantos sozinho
export default function AppleIcon() {
  return renderAppIcon(180, { rounded: false, padding: 0 });
}
