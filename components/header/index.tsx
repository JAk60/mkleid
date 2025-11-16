// components/Header.tsx - WITH AUTH

"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Wrapper from "@/components/Wrapper";
import Link from "next/link";
import Menu from "./Menu";
import MenuMobile from "./MenuMobile";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";

import { BsCart } from "react-icons/bs";
import { BiMenuAltRight } from "react-icons/bi";
import { VscChromeClose } from "react-icons/vsc";
import { IoPersonOutline } from "react-icons/io5";

const Header = () => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showMenCat, setShowMenCat] = useState(false);
  const [showWomenCat, setShowWomenCat] = useState(false);
  const [show, setShow] = useState("translate-y-0");
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get cart item count and auth
  const { itemCount } = useCart();
  const { user, isLoggedIn, logout } = useAuth();

  const subMenuMenData = [
    { id: "m1", name: "Oversized T-Shirts", url: "/products/gender/Male/mens-oversized-tshirt" },
    { id: "m2", name: "Jersey", url: "/products/gender/Male/mens-jersey" },
    { id: "m3", name: "Sweatshirts", url: "/products/gender/Male/mens-sweatshirt" },
    { id: "m4", name: "Shirts", url: "/products/gender/Male/mens-shirts" },
    { id: "m5", name: "Sweatpants", url: "/products/gender/Male/mens-sweatpants" },
  ];

  const subMenuWomenData = [
    { id: "w1", name: "Baby Tees", url: "/products/gender/Female/womens-baby-tees" },
    { id: "w2", name: "Jersey", url: "/products/gender/Female/womens-jersey" },
    { id: "w3", name: "Oversized T-Shirts", url: "/products/gender/Female/womens-oversized-tshirt" },
    { id: "w4", name: "Shirts", url: "/products/gender/Female/womens-shirts" },
    { id: "w5", name: "Sweatshirts", url: "/products/gender/Female/womens-sweatshirt" },
    { id: "w6", name: "Sweatpants", url: "/products/gender/Female/womens-sweatpants" },
    { id: "w7", name: "Flared Pants", url: "/products/gender/Female/womens-flared-pants" },
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

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header
      className={`w-full h-[50px] md:h-20 bg-white flex items-center justify-between z-20 sticky top-0 transition-transform duration-300 ${show}`}
    >
      <Wrapper className="h-[60px] flex justify-between items-center">
        <Link href="/">
          <Image
            src="/logo1.png"
            alt="Logo"
            width={320}
            height={60}
            className="object-contain"
          />
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
          {/* Cart Icon */}
          <Link href="/cart">
            <div className="w-8 md:w-12 h-8 md:h-12 rounded-full flex justify-center items-center hover:bg-white/[0.05] cursor-pointer relative">
              <BsCart className="text-[15px] md:text-[20px]" />
              {itemCount > 0 && (
                <div className="h-[14px] md:h-[18px] min-w-[14px] md:min-w-[18px] rounded-full bg-red-600 absolute top-1 left-5 md:left-7 text-white text-[10px] md:text-[12px] flex justify-center items-center px-[2px] md:px-[5px]">
                  {itemCount}
                </div>
              )}
            </div>
          </Link>

          {/* User Icon */}
          <div className="relative">
            {isLoggedIn ? (
              <>
                <div
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 md:w-12 h-8 md:h-12 rounded-full flex justify-center items-center hover:bg-white/[0.05] cursor-pointer"
                >
                  <IoPersonOutline className="text-[19px] md:text-[24px]" />
                </div>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-30">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-semibold truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link href="/login">
                <div className="w-8 md:w-12 h-8 md:h-12 rounded-full flex justify-center items-center hover:bg-white/[0.05] cursor-pointer">
                  <IoPersonOutline className="text-[19px] md:text-[24px]" />
                </div>
              </Link>
            )}
          </div>

          {/* Mobile icon */}
          <div className="w-8 md:w-12 h-8 md:h-12 rounded-full flex md:hidden justify-center items-center hover:bg-white/[0.05] cursor-pointer relative -mr-2">
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
        </div>
      </Wrapper>
    </header>
  );
};

export default Header;