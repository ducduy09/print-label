import { Navigate, Route, BrowserRouter as Router, Routes, useNavigate } from "react-router-dom";
import * as screenNames from "@navigator/screenNames";
import LoginScreen from "@container/auth/LoginScreen";
import { useEffect, useMemo, useRef, useState } from "react";
import NavigationService from "./NavigationService";
import { DataUser, ExchangeRateProps, LoginState } from "@type";
import { useDispatch, useSelector } from "react-redux";
import HomeScreen from "@container/home/HomeScreen";
import LoadingModal from "@component/loading/LoadingModal";
import LoadingManager from "@component/loading/LoadingManager";
import NetworkErrorModal from "@component/modal/NetworkErrorModal";
import NetworkErrorManager from "@component/network/NetworkErrorManager";
import SnackBarModal, { showSnackBar } from "@component/alert/SnackBarModal";
import SnackBarManager from "@component/alert/SnackBarManager";
import CreateIEGoods from "@container/home/CreateIEGoods";
import Setting from "@container/setting/Setting";
import Api from "@axios/helpers";
import { AUTH_URL, EXCHANGE_CURRENCY } from "@axios/urls";
import { changeExchangeRate } from "@container/home/redux/action";
import i18next from "@setup_assets/language/i18nextConfig";
import ChangePassword from "@container/auth/ChangePassword";
import { loginApp, onSetDataUser } from "@container/auth/redux/actions";
import TemplateBuilder from "@container/home/printLabel/TemplateBuilder";

const NavigationSetter = () => {
  const nav = useNavigate();
  useEffect(() => {
    NavigationService.setNavigator(nav);
  }, [nav]);
  return null;
};

const MainNavigator = () => {
  const dataUser: DataUser = useSelector(
    (state: any) => state.userLoginReducer,
  );
  const loginState: LoginState = useSelector(
    (state: any) => state.logoutReducer
  );
  const lang = useSelector((state: any) => state.settingReducer.lang);
  const changeRate: ExchangeRateProps = useSelector((state: any) => state.changeRateReducer);
  const dispatch = useDispatch();
  const networkErrorRef = useRef<NetworkErrorModal>(null);
  const snackBarRef: any = useRef(null);

  const loadingRef = useRef<any>(null);

  useEffect(() => {
    i18next.changeLanguage(lang);
  }, [lang]);

  useEffect(() => {
    loadingRef && LoadingManager.register(loadingRef);
    networkErrorRef && NetworkErrorManager.register(networkErrorRef);
    snackBarRef && SnackBarManager.register(snackBarRef);
    return () => {
      LoadingManager.unregister(loadingRef);
      NetworkErrorManager.unregister(networkErrorRef);
      SnackBarManager.unregister(snackBarRef);
    };
  }, []);

  const checkTokenAutoLogin = async () => {
    try {
      const resp = await Api.postWithJson(AUTH_URL.getInforUser, {}, true);
        if (resp.code == "200") {
          dispatch(
            onSetDataUser({
              id: resp.data.employeeId,
              fullname: resp.data.name,
              avatar: resp.data.avatar,
              wallpaper: resp.data.wallpaper,
              phone: resp.data.phone,
              hireDate: resp.data.hireDate,
              userType: resp.data.position,
              totalNotify: resp.data.totalNotify,
              department: resp.data.department,
              position: resp.data.position,
              mail: resp.data.email,
              role: resp.data.role,
              note: resp.data.note,
              code: resp.data.code,
            })
          );
          dispatch(loginApp());
        } else {
          showSnackBar("FALSE", i18next.t("serverError")!);
        }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (!dataUser.fullname || !loginState.isLogin) {
      checkTokenAutoLogin();
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if(!dataUser.fullname){
          return;
        }
        // Call API to get exchange rate
        const response = await Api.getData(
          EXCHANGE_CURRENCY,
          { from: "usd", to: changeRate.to },
          true
        );
        if (response.code === "200") {
          // Handle successful response
          dispatch(
            changeExchangeRate({
              from: response.data.from,
              to: response.data.to,
              rate: response.data.price,
              date: response.data.date,
            })
          );
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
      }
    })();
  }, [dataUser.fullname]);

  const renderRouterWithCheckerLogin = useMemo(() => {
    if(!dataUser.fullname || !loginState.isLogin)
      return (
        <>
          <Route
            path="*"
            element={<Navigate to={screenNames.LoginScreen} replace />}
          />
        </>
      ) 
    else
      return (
        <>
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
          <Route path="/" element={<HomeScreen />} />
        </>
      )
  }, [dataUser, loginState]);

  return (
    <Router>
      <NavigationSetter />
      <SnackBarModal ref={snackBarRef} />
      <LoadingModal ref={loadingRef} />
      <NetworkErrorModal ref={networkErrorRef} />
      <Routes>
        {/* Nếu chưa đăng nhập, chuyển về LoginScreen */}
        {renderRouterWithCheckerLogin}
        <Route
          path={screenNames.IEScreen.CreateIEGoods}
          element={<CreateIEGoods />}
        />
        <Route path={screenNames.Setting} element={<Setting />} />
        {/* Nếu vào Login khi đã đăng nhập, chuyển về Home */}
        <Route path={screenNames.LoginScreen} element={<LoginScreen />} />
        {/* Các route khác */}
        <Route
          path={screenNames.ChangePassword}
          element={<ChangePassword/>}
        />
        <Route 
          path={screenNames.Home.TemplateBuilder}
          element={<TemplateBuilder />}
        />
      </Routes>
    </Router>
  );
};

export default MainNavigator;