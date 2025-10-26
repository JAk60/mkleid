// components/Header.tsx - UPDATED VERSION

"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Wrapper from "@/components/Wrapper";
import Link from "next/link";
import Menu from "./Menu";
import MenuMobile from "./MenuMobile";

import { BsCart } from "react-icons/bs";
import { BiMenuAltRight } from "react-icons/bi";
import { VscChromeClose } from "react-icons/vsc";

const Header = () => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showMenCat, setShowMenCat] = useState(false);
  const [showWomenCat, setShowWomenCat] = useState(false);
  const [show, setShow] = useState("translate-y-0");
  const [lastScrollY, setLastScrollY] = useState(0);

  // ✅ Men submenu - UPDATED URLS
  const subMenuMenData = [
    { id: "m1", name: "Oversized T-Shirts", url: "/products/category/mens-oversized-tshirt" },
    { id: "m2", name: "Jersey", url: "/products/category/mens-jersey" },
    { id: "m3", name: "Sweatshirts", url: "/products/category/mens-sweatshirt" },
    { id: "m4", name: "Shirts", url: "/products/category/mens-shirts" },
    { id: "m5", name: "Sweatpants", url: "/products/category/mens-sweatpants" },
  ];

  // ✅ Women submenu - UPDATED URLS
  const subMenuWomenData = [
    { id: "w1", name: "Baby Tees", url: "/products/category/womens-baby-tees" },
    { id: "w2", name: "Jersey", url: "/products/category/womens-jersey" },
    { id: "w3", name: "Oversized T-Shirts", url: "/products/category/womens-oversized-tshirt" },
    { id: "w4", name: "Shirts", url: "/products/category/womens-shirts" },
    { id: "w5", name: "Sweatshirts", url: "/products/category/womens-sweatshirt" },
    { id: "w6", name: "Sweatpants", url: "/products/category/womens-sweatpants" },
    { id: "w7", name: "Flared Pants", url: "/products/category/womens-flared-pants" },
  ];

  const controlNavbar = useCallback(() => {
    if (window.scrollY > 200) {
      if (window.scrollY > lastScrollY && !mobileMenu) {
        setShow("-translate-y-[80px]");
      } else {
        setShow("shadow-sm");
      }
    } else {
      setShow("translate-y-0");
    }
    setLastScrollY(window.scrollY);
  }, [lastScrollY, mobileMenu]);

  useEffect(() => {
    window.addEventListener("scroll", controlNavbar);
    return () => {
      window.removeEventListener("scroll", controlNavbar);
    };
  }, [controlNavbar]);

  return (
    <header
      className={`w-full h-[50px] md:h-[80px] bg-white flex items-center justify-between z-20 sticky top-0 transition-transform duration-300 ${show}`}
    >
      <Wrapper className="h-[60px] flex justify-between items-center">
        <Link href="/">
          <div>Logo</div>
        </Link>

        <Menu
          showMenCat={showMenCat}
          setShowMenCat={setShowMenCat}
          showWomenCat={showWomenCat}
          setShowWomenCat={setShowWomenCat}
          subMenuMenData={subMenuMenData}
          subMenuWomenData={subMenuWomenData}
        />

        {mobileMenu && (
          <MenuMobile
            showMenCat={showMenCat}
            setShowMenCat={setShowMenCat}
            showWomenCat={showWomenCat}
            setShowWomenCat={setShowWomenCat}
            setMobileMenu={setMobileMenu}
            subMenuMenData={subMenuMenData}
            subMenuWomenData={subMenuWomenData}
          />
        )}

        <div className="flex items-center gap-2 text-black">
          {/* Mobile icon start */}
          <div className="w-8 md:w-12 h-8 md:h-12 rounded-full flex md:hidden justify-center items-center hover:bg-black/[0.05] cursor-pointer relative -mr-2">
            {mobileMenu ? (
              <VscChromeClose
                className="text-[16px]"
                onClick={() => setMobileMenu(false)}
              />
            ) : (
              <BiMenuAltRight
                className="text-[20px]"
                onClick={() => setMobileMenu(true)}
              />
            )}
          </div>
          {/* Mobile icon end */}
        </div>
      </Wrapper>
    </header>
  );
};

export default Header;