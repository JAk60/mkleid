// components/Menu.tsx

import React, { useRef } from "react";
import Link from "next/link";
import { BsChevronDown } from "react-icons/bs";

interface MenuProps {
  showMenCat: boolean;
  setShowMenCat: (show: boolean) => void;
  showWomenCat: boolean;
  setShowWomenCat: (show: boolean) => void;
  subMenuMenData: Array<{ id: string; name: string; url: string }>;
  subMenuWomenData: Array<{ id: string; name: string; url: string }>;
}

const Menu: React.FC<MenuProps> = ({
  showMenCat,
  setShowMenCat,
  showWomenCat,
  setShowWomenCat,
  subMenuMenData,
  subMenuWomenData,
}) => {
  const data = [
    { id: 1, name: "Home", url: "/" },
    { id: 2, name: "All Products", url: "/products" },
    { id: 3, name: "Men", subMenu: true },
    { id: 4, name: "Women", subMenu: true },
  ];

  // Timeout refs to prevent immediate closing
  const menTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const womenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (menuName: string) => {
    // Clear any pending timeouts
    if (menuName === "Men") {
      if (menTimeoutRef.current) clearTimeout(menTimeoutRef.current);
      setShowMenCat(true);
      setShowWomenCat(false);
    }
    if (menuName === "Women") {
      if (womenTimeoutRef.current) clearTimeout(womenTimeoutRef.current);
      setShowWomenCat(true);
      setShowMenCat(false);
    }
  };

  const handleMouseLeave = (menuName: string) => {
    // Add delay before closing to prevent accidental closes
    if (menuName === "Men") {
      menTimeoutRef.current = setTimeout(() => {
        setShowMenCat(false);
      }, 150);
    }
    if (menuName === "Women") {
      womenTimeoutRef.current = setTimeout(() => {
        setShowWomenCat(false);
      }, 150);
    }
  };

  return (
    <ul className="hidden md:flex items-center gap-8 font-medium text-black">
      {data.map((item) => {
        return (
          <React.Fragment key={item.id}>
            {!!item?.subMenu ? (
              <li
                className="cursor-pointer flex items-center gap-2 relative"
                onMouseEnter={() => handleMouseEnter(item.name)}
                onMouseLeave={() => handleMouseLeave(item.name)}
              >
                {item.name}
                <BsChevronDown size={14} />

                {item.name === "Men" && showMenCat && (
                  <ul className="bg-white absolute top-6 left-0 min-w-[250px] px-1 py-1 text-black shadow-lg rounded-md z-10">
                    {subMenuMenData.map((submenu) => {
                      return (
                        <Link
                          key={submenu.id}
                          href={submenu.url}
                          onClick={(e) => {
                            setShowMenCat(false);
                            if (menTimeoutRef.current) {
                              clearTimeout(menTimeoutRef.current);
                            }
                          }}
                        >
                          <li className="h-12 flex justify-between items-center px-3 hover:bg-black/[0.03] rounded-md">
                            {submenu.name}
                          </li>
                        </Link>
                      );
                    })}
                  </ul>
                )}

                {item.name === "Women" && showWomenCat && (
                  <ul className="bg-white absolute top-6 left-0 min-w-[250px] px-1 py-1 text-black shadow-lg rounded-md z-10">
                    {subMenuWomenData.map((submenu) => {
                      return (
                        <Link
                          key={submenu.id}
                          href={submenu.url}
                          onClick={(e) => {
                            setShowWomenCat(false);
                            if (womenTimeoutRef.current) {
                              clearTimeout(womenTimeoutRef.current);
                            }
                          }}
                        >
                          <li className="h-12 flex justify-between items-center px-3 hover:bg-black/[0.03] rounded-md">
                            {submenu.name}
                          </li>
                        </Link>
                      );
                    })}
                  </ul>
                )}
              </li>
            ) : (
              <li className="cursor-pointer">
                <Link href={item?.url || "/"}>{item.name}</Link>
              </li>
            )}
          </React.Fragment>
        );
      })}
    </ul>
  );
};

export default Menu;