"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import {
  Bars3Icon,
  PlusCircleIcon,
  HomeIcon,
  XMarkIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Calendar, Tent, LogOut } from "lucide-react";

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  current: boolean;
};

type NavigationSection = {
  title?: string;
  items: NavigationItem[];
};

const navigation: NavigationSection[] = [
  {
    items: [
      {
        name: "Dashboard",
        href: "/admin",
        icon: HomeIcon,
        current: false,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        name: "Besuch erfassen",
        href: "/admin/addvisits",
        icon: PlusCircleIcon,
        current: false,
      },
      {
        name: "Trips und Kilometer update",
        href: "/admin/migrate",
        icon: PlusCircleIcon,
        current: false,
      },
      {
        name: "Trips Verwaltung",
        href: "/admin/trips",
        icon: PlusCircleIcon,
        current: false,
      },
    ],
  },
  {
    title: "Inhalt",
    items: [
      {
        name: "Besuche",
        href: "/admin/visits",
        icon: Calendar,
        current: false,
      },
      {
        name: "Plätze",
        href: "/admin/campsites",
        icon: Tent,
        current: false,
      },
    ],
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    navigation.forEach((section) => {
      section.items.forEach((item) => {
        item.current = item.href === pathname;
      });
    });
  }, [pathname]);

  return (
    <>
      <div>
        {/* Mobile Sidebar */}
        <Dialog
          open={sidebarOpen}
          onClose={setSidebarOpen}
          className="relative z-50 lg:hidden"
        >
          <DialogBackdrop className="fixed inset-0 bg-gray-900/80" />
          <div className="fixed inset-0 flex">
            <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1 transform bg-gray-900 px-6 pb-2 transition duration-300 ease-in-out">
              <TransitionChild>
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="-m-2.5 p-2.5"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon
                      aria-hidden="true"
                      className="h-6 w-6 text-white"
                    />
                  </button>
                </div>
              </TransitionChild>
              <SidebarContent />
            </DialogPanel>
          </div>
        </Dialog>

        {/* Desktop Sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
          <SidebarContent />
        </div>

        {/* Mobile Header */}
        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-gray-900 px-4 py-4 shadow-sm sm:px-6 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-m-2.5 p-2.5 text-gray-400 lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon aria-hidden="true" className="h-6 w-6" />
          </button>
          <div className="flex-1 text-sm font-semibold text-white">
            Admin Dashboard
          </div>
          {session?.user && (
            <div className="flex items-center">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || ""}
                  className="h-8 w-8 rounded-full bg-gray-800"
                />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SidebarContent() {
  const { data: session } = useSession();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
      <div className="flex h-16 text-white shrink-0 items-center font-varela text-4xl">
        CampCMS
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          {navigation.map((section, sectionIdx) => (
            <li key={sectionIdx}>
              {section.title && (
                <div className="text-xs font-semibold text-gray-400">
                  {section.title}
                </div>
              )}
              <ul
                role="list"
                className={classNames(
                  section.title ? "mt-2" : "",
                  "-mx-2 space-y-1"
                )}
              >
                {section.items.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className={classNames(
                        item.current
                          ? "bg-gray-800 text-white"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white",
                        "group flex gap-x-3 rounded-md p-2 text-l font-creteround"
                      )}
                    >
                      <item.icon
                        aria-hidden="true"
                        className="h-6 w-6 shrink-0"
                      />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}

          {/* User Profile Section */}
          {session?.user && (
            <li className="mt-auto">
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center gap-x-3 p-2 text-sm font-semibold text-gray-400">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || ""}
                      className="h-8 w-8 rounded-full bg-gray-800"
                    />
                  ) : (
                    <UserCircleIcon className="h-8 w-8" />
                  )}
                  <div className="flex-1 truncate">
                    <div className="text-white">{session.user.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {session.user.email}
                    </div>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="text-gray-400 hover:text-white"
                    title="Abmelden"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}
