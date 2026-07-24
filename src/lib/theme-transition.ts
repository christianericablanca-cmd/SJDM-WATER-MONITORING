export function animateThemeTransition(
  x: number,
  y: number,
  to: "light" | "dark"
): void {
  document.documentElement.style.setProperty("--click-x", `${x}px`);
  document.documentElement.style.setProperty("--click-y", `${y}px`);

  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };

  if (doc.startViewTransition) {
    doc.startViewTransition(() => {
      document.documentElement.classList.toggle("dark", to === "dark");
      localStorage.setItem("theme", to);
    });
  } else {
    document.documentElement.classList.toggle("dark", to === "dark");
    localStorage.setItem("theme", to);
  }
}
