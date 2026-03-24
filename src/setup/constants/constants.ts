export const THOUSAND = 1000;
export const MILLION = 1000 * THOUSAND;
export const BILLION = 1000 * MILLION;
export const ONE_DAY = 24 * 60 * 60 * 1000;

export const DEEP_LINK_SCHEME = 'mkbwarehouseapps://';

export const LANGUAGE = {
  ENGLISH: 'en',
  VIETNAMESE: 'vn', // 🔹 Fix lỗi "VIETNAM" → "VIETNAMESE"
};

export const setRefreshToken = async (token: string) => {
  try {
    localStorage.setItem("REFRESH_TOKEN", token);
  } catch (error) {
    console.log("Error:", error);
  }
};

export const getRefreshToken = async () => {
  try {
    return localStorage.getItem("REFRESH_TOKEN");
  } catch (error) {
    console.log("Error:", error);
  }
};