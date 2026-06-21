import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LogoIcon } from "~/components/logo";

/** Full-screen split layout (login-02): branded form column + image column. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-xs flex-col items-center gap-6">
            <a href="#link" className="flex items-center gap-2">
              <LogoIcon className="size-7 text-foreground" />
              <span className="font-medium text-foreground!">FUNISLAND</span>
            </a>
            <div className="w-full">{children}</div>
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <img
          src="/images/rose-red-wall.png"
          alt="an abstract background"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
