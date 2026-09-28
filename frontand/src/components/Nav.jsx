import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import logo2 from "../assets/logo2.png";
import dp from "../assets/dp.jpg";

import { authContext } from "../context/AuthContext.jsx";
import { userDatacontext } from "../context/UserContext.jsx";
import useApi from "../hooks/useApi.js";

import { MdSearch } from "react-icons/md";
import { IoHomeSharp, IoNotifications } from "react-icons/io5";
import { FaUserGroup } from "react-icons/fa6";
import { MdWork } from "react-icons/md";
import { IoChatbubbleEllipses } from "react-icons/io5";
import { MdKeyboardArrowDown } from "react-icons/md";
import { MdGridView } from "react-icons/md";
import { IoMenu, IoClose } from "react-icons/io5";

const NOTIFICATION_POLL_MS = 20000;

const Nav = () => {
  const navigate = useNavigate();

  const { serverUrl } = useContext(authContext);
  const api = useApi();

  const { userData, setUserData } = useContext(userDatacontext);

  const [showProfile, setShowProfile] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // ================= UNREAD NOTIFICATIONS BADGE =================

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await api.get("/notifications");
        if (!cancelled) setUnreadCount(res.data.unreadCount || 0);
      } catch {
        // Silently ignore — badge just won't update this cycle
      }
    };

    poll();
    const interval = setInterval(poll, NOTIFICATION_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================= LOGOUT =================

  const handleSignOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true,
      });

      setUserData(null);

      setShowProfile(false);

      navigate("/login");

    } catch (error) {
      console.log("Logout Error:", error);
    }
  };


  // ================= SEARCH =================

  const handleSearch = (e) => {
    e.preventDefault();

    if (!search.trim()) return;

    setShowMobile(false);
    navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };


  // ================= PROFILE =================

  const handleProfile = () => {
    setShowProfile(false);
    setShowMobile(false);

    navigate(`/profile/${userData?.userName}`);
  };


  // ================= HOME =================

  const handleHome = () => {
    setShowProfile(false);
    setShowMobile(false);

    navigate("/");
  };


  // ================= NETWORK / JOBS / MESSAGING / NOTIFICATIONS =================

  const handleNetwork = () => {
    setShowProfile(false);
    setShowMobile(false);
    navigate("/connections");
  };

  const handleMessaging = () => {
    setShowProfile(false);
    setShowMobile(false);
    navigate("/messages");
  };

  const handleNotifications = () => {
    setShowProfile(false);
    setShowMobile(false);
    navigate("/notifications");
  };


  // ================= USER NAME =================

  const fullName =
    userData?.firstName && userData?.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : "Your Name";


  return (
    <nav className="fixed top-0 left-0 w-full h-[74px] bg-white border-b border-gray-200 z-50">

      <div className="max-w-[1128px] mx-auto h-full flex items-center justify-between px-3">


        {/* ================= LEFT ================= */}

        <div className="flex items-center gap-2">

          {/* Logo */}

          <button
            onClick={handleHome}
            className="w-[38px] h-[38px] flex-shrink-0"
          >
            <img
              src={logo2}
              alt="LinkedIn"
              className="w-full h-full object-contain"
            />
          </button>


          {/* Desktop Search */}

          <form
            onSubmit={handleSearch}
            className="hidden sm:flex w-[240px] md:w-[280px] lg:w-[320px] h-[34px] bg-[#eef3f8] rounded-full items-center px-3 gap-2"
          >

            <MdSearch className="text-[23px] text-gray-700 flex-shrink-0" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent outline-none border-none text-[14px] text-gray-700"
            />

          </form>


          {/* Mobile Search */}

          <button className="sm:hidden w-[38px] h-[38px] flex items-center justify-center">

            <MdSearch className="text-[27px] text-gray-700" />

          </button>

        </div>


        {/* ================= DESKTOP MENU ================= */}

        <div className="hidden md:flex h-full items-center">


          {/* HOME */}

          <NavItem
            icon={<IoHomeSharp />}
            title="Home"
            active={true}
            onClick={handleHome}
          />


          {/* NETWORK */}

          <NavItem
            icon={<FaUserGroup />}
            title="My Network"
            onClick={handleNetwork}
          />


          {/* JOBS */}

          <NavItem
            icon={<MdWork />}
            title="Jobs"
          />


          {/* MESSAGING */}

          <NavItem
            icon={<IoChatbubbleEllipses />}
            title="Messaging"
            onClick={handleMessaging}
          />


          {/* NOTIFICATIONS */}

          <NavItem
            icon={<IoNotifications />}
            title="Notifications"
            onClick={handleNotifications}
            badge={unreadCount}
          />


          {/* ================= PROFILE ================= */}

          <div className="relative h-full">

            <button
              onClick={() => setShowProfile(!showProfile)}
              className="h-full min-w-[65px] px-2 flex flex-col items-center justify-center text-gray-600 hover:text-black"
            >

              <div className="w-[25px] h-[25px] rounded-full overflow-hidden">

                <img
                  src={userData?.userprofileimage || dp}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />

              </div>


              <div className="flex items-center text-[11px] leading-3 mt-[3px]">

                <span>Me</span>

                <MdKeyboardArrowDown className="text-[15px]" />

              </div>

            </button>


            {/* ================= PROFILE DROPDOWN ================= */}

            {showProfile && (

              <div className="absolute right-0 top-[70px] w-[280px] bg-white rounded-lg shadow-xl border border-gray-200 p-4">


                {/* User */}

                <div className="flex items-center gap-3">

                  <div className="w-[55px] h-[55px] rounded-full overflow-hidden">

                    <img
                      src={userData?.userprofileimage || dp}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />

                  </div>


                  <div>

                    <h3 className="font-semibold text-gray-800">

                      {fullName}

                    </h3>


                    <p className="text-[13px] text-gray-500">

                      {userData?.headline || "Full Stack Developer"}

                    </p>

                  </div>

                </div>


                {/* VIEW PROFILE */}

                <button
                  onClick={handleProfile}
                  className="w-full mt-4 h-[32px] rounded-full border border-blue-600 text-blue-600 font-semibold text-sm hover:bg-blue-50"
                >

                  View Profile

                </button>


                {/* ACCOUNT */}

                <div className="border-t mt-4 pt-3">

                  <p className="text-[12px] font-semibold text-gray-500 mb-2">

                    ACCOUNT

                  </p>


                  <button
                    onClick={handleProfile}
                    className="w-full text-left text-sm text-gray-700 py-2 px-2 rounded hover:bg-gray-100"
                  >

                    Profile

                  </button>


                  <button
                    className="w-full text-left text-sm text-gray-700 py-2 px-2 rounded hover:bg-gray-100"
                  >

                    Settings & Privacy

                  </button>


                  <button
                    className="w-full text-left text-sm text-gray-700 py-2 px-2 rounded hover:bg-gray-100"
                  >

                    Help

                  </button>


                  {/* SIGN OUT */}

                  <button
                    onClick={handleSignOut}
                    className="w-full text-left text-sm text-red-600 py-2 px-2 rounded hover:bg-red-50"
                  >

                    Sign out

                  </button>

                </div>

              </div>

            )}

          </div>


          {/* DIVIDER */}

          <div className="h-[45px] w-[1px] bg-gray-200 mx-2" />


          {/* FOR BUSINESS */}

          <div className="hidden lg:flex h-full flex-col items-center justify-center px-2 cursor-pointer text-gray-600 hover:text-black">

            <MdGridView className="text-[23px]" />

            <div className="flex items-center text-[11px]">

              <span>For Business</span>

              <MdKeyboardArrowDown className="text-[14px]" />

            </div>

          </div>


          {/* PREMIUM */}

          <div className="hidden xl:flex h-full items-center px-2">

            <span className="text-[12px] text-[#915907] text-center whitespace-nowrap cursor-pointer">

              Try Premium for Rs 0

            </span>

          </div>

        </div>


        {/* ================= MOBILE BUTTON ================= */}

        <button
          onClick={() => setShowMobile(!showMobile)}
          className="md:hidden flex items-center justify-center"
        >

          {showMobile ? (

            <IoClose className="text-[28px] text-gray-700" />

          ) : (

            <IoMenu className="text-[28px] text-gray-700" />

          )}

        </button>

      </div>


      {/* ================= MOBILE MENU ================= */}

      {showMobile && (

        <div className="md:hidden absolute top-[74px] left-0 w-full bg-white border-b border-gray-200 shadow-lg">


          {/* MOBILE SEARCH */}

          <form
            onSubmit={handleSearch}
            className="mx-4 mt-4 h-[40px] bg-[#eef3f8] rounded-full flex items-center px-3 gap-2"
          >

            <MdSearch className="text-[23px] text-gray-600" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent outline-none"
            />

          </form>


          {/* MOBILE ITEMS */}

          <div className="grid grid-cols-5 py-3 border-b">

            <MobileItem
              icon={<IoHomeSharp />}
              title="Home"
              onClick={handleHome}
            />

            <MobileItem
              icon={<FaUserGroup />}
              title="Network"
              onClick={handleNetwork}
            />

            <MobileItem
              icon={<MdWork />}
              title="Jobs"
            />

            <MobileItem
              icon={<IoChatbubbleEllipses />}
              title="Messaging"
              onClick={handleMessaging}
            />

            <MobileItem
              icon={<IoNotifications />}
              title="Alerts"
              onClick={handleNotifications}
              badge={unreadCount}
            />

          </div>


          {/* MOBILE PROFILE */}

          <button
            onClick={handleProfile}
            className="w-full p-4 flex items-center gap-3 text-left"
          >

            <div className="w-[45px] h-[45px] rounded-full overflow-hidden">

              <img
                src={userData?.userprofileimage || dp}
                alt="Profile"
                className="w-full h-full object-cover"
              />

            </div>


            <div>

              <p className="font-semibold text-gray-800">

                {fullName}

              </p>

              <p className="text-sm text-gray-500">

                View Profile

              </p>

            </div>

          </button>


          {/* MOBILE LOGOUT */}

          <button
            onClick={handleSignOut}
            className="w-full border-t p-4 text-left text-red-600"
          >

            Sign out

          </button>

        </div>

      )}

    </nav>
  );
};


/* ================= DESKTOP ITEM ================= */

const NavItem = ({ icon, title, active, onClick, badge }) => {

  return (

    <button
      onClick={onClick}
      className={`relative h-full min-w-[72px] lg:min-w-[80px] px-2 flex flex-col items-center justify-center cursor-pointer transition
      ${
        active
          ? "text-black"
          : "text-gray-600 hover:text-black"
      }`}
    >

      <div className="relative text-[22px]">

        {icon}

        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red-600 text-white text-[10px] leading-[16px] text-center font-semibold">
            {badge > 9 ? "9+" : badge}
          </span>
        )}

      </div>


      <span className="text-[11px] whitespace-nowrap mt-[2px]">

        {title}

      </span>


      {active && (

        <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-black" />

      )}

    </button>

  );
};


/* ================= MOBILE ITEM ================= */

const MobileItem = ({ icon, title, onClick, badge }) => {

  return (

    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 text-gray-600 cursor-pointer"
    >

      <div className="relative text-[22px]">

        {icon}

        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red-600 text-white text-[10px] leading-[16px] text-center font-semibold">
            {badge > 9 ? "9+" : badge}
          </span>
        )}

      </div>


      <span className="text-[10px]">

        {title}

      </span>

    </button>

  );
};


export default Nav;