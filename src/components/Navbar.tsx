"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { useSession, signIn, signOut } from "next-auth/react";
import { ModeToggle } from "./ModeToggle";

const Navbar = () => {
  const { data: session } = useSession();
  return (
    <header>
      <nav className="flex items-center justify-between py-4">
        <h2 className="font-bold text-xl">TubeSync</h2>

        <ul className="flex items-center gap-10">
          <li>
            <Link className="font-semibold" href="/">
              Home
            </Link>
          </li>
          <li>
            <ModeToggle />
          </li>
          {session ? (
            <li>
              <Button onClick={() => signOut()}>Sign out</Button>
            </li>
          ) : (
            <li>
              <Button onClick={() => signIn()}>Sign in</Button>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
