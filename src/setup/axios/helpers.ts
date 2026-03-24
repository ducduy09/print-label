/**
 * helper.js - for storing reusable logic.
 */
import axios from 'axios'
import Status from './Status';
import { hideLoading, showLoading } from '@component/loading/LoadingModal';
import { showNetworkError } from '@component/modal/NetworkErrorModal';

const CancelToken = axios.CancelToken;

const TIMEOUT_MESSAGE = 'TIMEOUT';
const TIMEOUT = 30 * 60 * 1000;
const HEIGHTTIMEOUT = 30 * 60 * 1000;


export const DEPLOY_URL = 'http://localhost:8080/';
// export const DEPLOY_URL = 'https://server-warehouse.mkb-tech.vn/';
// export const DEPLOY_DOWNLOAD_URL = 'http://salesappapiuat.tpb.vn/upload/';

let BASE_URL = DEPLOY_URL;
// export let DOWNLOAD_URL = DEPLOY_DOWNLOAD_URL;

export const setDevMode = (isDev: boolean) => {
  // if (isDev) {
  //   BASE_URL = TEST_URL;
  //   BASE_URL_IMAGE = TEST_URL_IMAGE;
  //   DOWNLOAD_URL = TEST_URL_IMAGE_UPLOADED;
  // } else {
    BASE_URL = DEPLOY_URL;
    // DOWNLOAD_URL = DEPLOY_DOWNLOAD_URL;
  // }

  ApiClient.instance = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT,
  });
};

const axiosInit = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
});

class ApiClient {
  static instance: any;

  constructor(_instance: any) {
    if (ApiClient.instance) {
      return ApiClient.instance;
    } else {
      ApiClient.instance = _instance;
    }
  }

  mapRequestCancel: Map<string, any> = new Map();

  isCheckingActiveUser: boolean = false;

  //get
  async fetch(
    url: string,
    data?: object,
    loading: boolean = false,
    isAuth = true,
  ) {

    loading && showLoading();

    // this.checkActiveUser(url);

    return Promise.race([
      ApiClient.instance.get(url, {
        params: data || {},
        cancelToken: new CancelToken((cancel) => {
          this.mapRequestCancel.set(url, cancel);
        }),
      }),
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(TIMEOUT_MESSAGE);
        }, TIMEOUT);
      }),
    ])
      .then((response) => {
        hideLoading();
        return response.data;
      })
      .catch((error) => {
        if (axios.isCancel(error)) {
          hideLoading();
          return;
        }
        this.showError();
        return new Promise((resolve, reject) => {
          reject(error);
        });
      });
  }

  async getData(
    url: string,
    data?: object,
    loading: boolean = false,
  ) {

    const headers: Record<string, string> = {};

    loading && showLoading();
    const request = () =>
      ApiClient.instance.get(url, {
        params: data || {},
        headers,
        cancelToken: new CancelToken((cancel) => {
          this.mapRequestCancel.set(url, cancel);
        }),
      }
    );

    try {
      const response = await Promise.race([
        request(),
        new Promise((_, reject) =>
          setTimeout(() => reject(TIMEOUT_MESSAGE), TIMEOUT)
        ),
      ]);
      hideLoading();
      return response.data;
    } catch (error: any) {
      if (axios.isCancel(error)) return;
      // ❗ Token hết hạn
      hideLoading();
      return Promise.reject(error);
    }
  }
  //post
  async post(
    url: string,
    data?: object,
    loading: boolean = false,
  ) {

    loading && showLoading();

    // this.checkActiveUser(url);

    return Promise.race([
      ApiClient.instance.post(url, data, {
        cancelToken: new CancelToken((cancel) => {
          this.mapRequestCancel.set(url, cancel);
        }),
      }),
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(TIMEOUT_MESSAGE);
        }, TIMEOUT);
      }),
    ])
      .then((response) => {
        hideLoading();
        return response.data;
      })
      .catch((error) => {
        if (axios.isCancel(error)) {
          hideLoading();
          return;
        }
        this.showError();
        return new Promise((resolve, reject) => {
          reject(error);
        });
      });
  }

  async postWithJson(
    url: string,
    data?: object | string | number,
    loading: boolean = false,
    heightTimeOut = true,
    isErrorPushNotification: boolean = true
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    loading && showLoading();

    const request = () =>
      ApiClient.instance.post(url, data, {
        headers,
        withCredentials: true,
        cancelToken: new CancelToken((cancel) => {
          this.mapRequestCancel.set(url, cancel);
        }),
      });

    try {
      const response = await Promise.race([
        request(),
        new Promise((_, reject) =>
          setTimeout(() => reject(TIMEOUT_MESSAGE), heightTimeOut ? HEIGHTTIMEOUT : TIMEOUT)
        ),
      ]);

      hideLoading();
      return response.data;

    } catch (error: any) {
      if (axios.isCancel(error)) return;

      hideLoading();
      if (isErrorPushNotification) {
        this.showError();
      }

      return Promise.reject(error);
    }
  }


  async postWidthJsonTracking(
    url: string,
    data?: object | string | number,
    loading: boolean = false,
    // isApplicationJson?: boolean,
  ) {
    const headers = {
      'Content-Type': 'application/json',
    };

    loading && showLoading();

    // this.checkActiveUser(url);

    return Promise.race([
      ApiClient.instance.post(url, data, {
        headers: headers,
        cancelToken: new CancelToken((cancel) => {
          this.mapRequestCancel.set(url, cancel);
        }),
      }),
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(TIMEOUT_MESSAGE);
        }, TIMEOUT);
      }),
    ])
      .then((response) => {
        hideLoading();
        return response.data;
      })
      .catch((error) => {
        if (axios.isCancel(error)) {
          console.log('REQUEST CANCEL ----->: ', error);
          hideLoading();
          return;
        }
        if (error.response?.status?.toString() === Status.UNAUTHORIZED) {
          return;
        }
        console.log(url + 'ERROR ---->', error.response);
        return new Promise((resolve, reject) => {
          reject(error);
        });
      });
  }

  async login(
    url: string,
    data?: object | string | number,
    loading: boolean = false,
  ) {
    loading && showLoading();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    try {
      const response: any = await Promise.race([
        ApiClient.instance.post(url, data, { headers, withCredentials: true }),
        new Promise((_, reject) => {
          setTimeout(() => reject(TIMEOUT_MESSAGE), TIMEOUT);
        }),
      ]);
      loading && hideLoading();
      return response.data;
    } catch (error: any) {
      loading && hideLoading();
      console.log("Login error:", error);
      return Promise.reject(error?.response ?? error);
    }
  }

  //post form data
  async postFormData(
    url: string,
    body: any,
    loading: boolean = false,
  ) {

    let data = new FormData();
    Object.keys(body).forEach((key) => {
      if (body[key] instanceof Array) {
        body[key].forEach((value: any) => {
          data.append(`${key}[]`, value);
        });
      } else {
        data.append(key, body[key]);
      }
    });

    loading && showLoading();

    // this.checkActiveUser(url);

    return Promise.race([
      ApiClient.instance.post(url, data, {
        cancelToken: new CancelToken((cancel) => {
          this.mapRequestCancel.set(url, cancel);
        }),
      }),
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(TIMEOUT_MESSAGE);
        }, TIMEOUT);
      }),
    ])
      .then((response) => {
        hideLoading();
        return response.data;
      })
      .catch(async (error) => {
        console.log('error', error.response);
        if (axios.isCancel(error)) {
          hideLoading();
          return;
        }

        hideLoading();
        return Promise.reject(error);
      });
  }

  async postFormDataWithJson(
    url: string,
    body: any,
    loading: boolean = false,
  ) {
    const data = new FormData();

    Object.keys(body).forEach((key) => {
      const value = body[key];

      // 1️⃣ File
      if (value instanceof File) {
        data.append(key, value);
        return;
      }

      // 2️⃣ Array
      if (Array.isArray(value)) {
        value.forEach((item: any) => {
          if (item instanceof File) {
            data.append(key, item);
          } else if (typeof item === 'object') {
            data.append(
              key,
              new Blob([JSON.stringify(item)], { type: 'application/json' })
            );
          } else {
            data.append(key, item);
          }
        });
        return;
      }

      // 3️⃣ Object (JSON)
      if (typeof value === 'object' && value !== null) {
        data.append(
          key,
          new Blob([JSON.stringify(value)], {
            type: 'application/json',
          })
        );
        return;
      }

      // 4️⃣ Primitive
      data.append(key, value);
    });

    loading && showLoading();

    return Promise.race([
      ApiClient.instance.post(url, data, {
        cancelToken: new CancelToken((cancel) => {
          this.mapRequestCancel.set(url, cancel);
        }),
      }),
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(TIMEOUT_MESSAGE);
        }, TIMEOUT);
      }),
    ])
      .then((response) => {
        hideLoading();
        return response.data;
      })
      .catch(async (error) => {
        console.log('error', error.response);
        if (axios.isCancel(error)) {
          hideLoading();
          return;
        }
        hideLoading();
        return Promise.reject(error);
      });
  }

  //put
  async put(
    url: string,
    data?: object,
    loading: boolean = false,
  ) {
    loading && showLoading();

    return Promise.race([
      ApiClient.instance.put(url, data, {
        cancelToken: new CancelToken((cancel) => {
          this.mapRequestCancel.set(url, cancel);
        }),
      }),
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(TIMEOUT_MESSAGE);
        }, TIMEOUT);
      }),
    ])
      .then((response) => {
        hideLoading();
        return response.data;
      })
      .catch((error) => {
        if (axios.isCancel(error)) {
          hideLoading();
          return;
        }
        this.showError();
        return new Promise((resolve, reject) => {
          reject(error);
        });
      });
  }

  //delete
  async delete(url: string, loading: boolean = false) {


    loading && showLoading();

    // this.checkActiveUser(url);

    return Promise.race([
      ApiClient.instance.delete(url, {
        cancelToken: new CancelToken((cancel) => {
          this.mapRequestCancel.set(url, cancel);
        }),
      }),
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(TIMEOUT_MESSAGE);
        }, TIMEOUT);
      }),
    ])
      .then((response) => {
        hideLoading();
        return response.data;
      })
      .catch((error) => {
        if (axios.isCancel(error)) {
          console.log('REQUEST CANCEL ----->', error.message);
          hideLoading();
          return;
        }
        this.showError();
        console.log(url + 'ERROR ---->', error.response);
        return new Promise((resolve, reject) => {
          reject(error);
        });
      });
  }

  private showError() {
    hideLoading();
    setTimeout(() => {
      showNetworkError('serverErr');
    }, 300);
  }

  cancelRequest(url: string) {
    const cancel = this.mapRequestCancel.get(url);
    cancel && cancel();
  }
}

const Api = new ApiClient(axiosInit);
export default Api;