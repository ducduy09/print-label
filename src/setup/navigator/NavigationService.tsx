let navigator: any = null;

function setNavigator(nav: any) {
  navigator = nav;
}

function navigate(routeName: string, params?: object) {
  if (navigator) {
    navigator(routeName, { state: params });
  }
}

function reset(routeName: string, params?: object) {
  if (navigator) {
    navigator(routeName, { replace: true, state: params });
  }
}

function goBack() {
  if (navigator) {
    navigator(-1);
  }
}

export default {
  setNavigator,
  navigate,
  reset,
  goBack,
};