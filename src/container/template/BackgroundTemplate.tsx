import React, { useState } from "react";
import images from "@setup_assets/image/images";
import NavigationService from "@navigator/NavigationService";
import * as screenNames from "@navigator/screenNames";
import InstallAppButton from "@component/button/InstallAppButton";
import { t } from "i18next";

const BackgroundTemplate = ({
  children,
  bottomSideBar,
  tabNavigation,
}: {
  children: React.ReactNode;
  bottomSideBar?: React.ReactNode;
  tabNavigation?: React.ReactNode;
}) => {
    const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div className="flex h-screen font-sans text-sm text-gray-800">
      {/* Sidebar */}
      {showSidebar && (
        <aside className="w-64 bg-white border-r shadow-sm mt-5 relative">
          <button
            className="flex items-center justify-center self-center h-20 w-full"
            onClick={() => {
              NavigationService.reset(screenNames.Home.HomeScreen);
            }}
          >
            <img className="w-32 object-center" src={images.logo} />
          </button>
          <nav className="flex-1 pt-4">
            <div className="px-4 py-2.5 text-sm cursor-pointer bg-blue-50 text-blue-600 border-l-4 border-blue-600">
              {t('template')}
            </div>
            <button onClick={() => setShowSidebar(false)}
                title="Ẩn sidebar" className="w px-4 py-2.5 text-sm">
              <span>&#10006;</span>
            </button>
          </nav>
          {!!bottomSideBar ? 
            <div className="absolute flex justify-between bottom-4 w-full">{bottomSideBar}</div> 
            : 
            <div className="absolute flex justify-between bottom-4 left-4 right-4">
              <button
                className="absolute top-2 right-2 p-2 rounded hover:bg-gray-100"
                onClick={() => setShowSidebar(false)}
                title="Ẩn sidebar"
              >
                {/* Icon đóng, có thể dùng SVG hoặc ký tự */}
                <span>&#10006;</span>
              </button>
            </div>
          }
        </aside>
      )}
      {!showSidebar && (
        <button
          className="absolute top-5 left-2 z-10 p-2 bg-white border rounded shadow"
          onClick={() => setShowSidebar(true)}
          title="Mở sidebar"
        >
          {/* Icon mở, có thể dùng SVG hoặc ký tự */}
          <span>&#9776;</span>
        </button>
      )}
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <header className="flex justify-between items-center px-5 py-2 bg-white border-b">
          <div />
          <div className="flex gap-2 items-center">
            <InstallAppButton />
            <input
              className="border text-sm px-2 py-1 rounded "
              placeholder="Tìm kiếm..."
            />
            <button
              onClick={() => {
                NavigationService.navigate(screenNames.Setting);
              }}
            >
              {/* {
                !!dataUser.avatar ? 
                <img src={`data:image/jpeg;base64,${dataUser.avatar}`} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                 :
                <AvatarName name={dataUser.fullname} />
              } */}
            </button>
          </div>
        </header>
        {/* Tab Navigation */}
        {tabNavigation}
        {/* Page Content */}
        {children}
      </div>
    </div>
  );
};

export default BackgroundTemplate;
