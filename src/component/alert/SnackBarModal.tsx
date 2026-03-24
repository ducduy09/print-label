import {
  forwardRef,
  useImperativeHandle,
  useState
} from "react";
import SnackBarManager from "@component/alert/SnackBarManager";

export function showSnackBar(
  status: "SUCCESS" | "FALSE" | "WARNING",
  title: string,
  time?: number
) {
  const ref: any = SnackBarManager.getDefault();
  if (ref) {
    ref?.current?.showModal(status, title, time);
  }
}

interface SnackBarModalProps {

}

const SnackBarModal = (props: SnackBarModalProps, ref: any) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [status, setStatus] = useState<"SUCCESS" | "FALSE" | "WARNING">(
    "SUCCESS"
  );
  const [title, setTitle] = useState<string>("");

  useImperativeHandle(ref, () => ({
    showModal,
  }));

  const showModal = (
    status: "SUCCESS" | "FALSE" | "WARNING",
    title: string,
    time?: number
  ) => {
    setStatus(status);
    setTitle(title);
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
    }, time || 3000);
  };

  if (!visible) return null;

  const renderbgColor = () => {
    switch (status) {
      case "SUCCESS":
        return (
          <div
            role="alert"
            className="relative flex items-start w-full border p-2 rounded-none border-b-0 border-l-4 border-r-0 border-t-0 border-green-500 bg-green-500/10 font-medium text-green-500"
          >
            <span className="grid place-items-center shrink-0 p-1">
              <svg
                width="1.5em"
                height="1.5em"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                color="currentColor"
                className="h-5 w-5"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M12 1.25C6.06294 1.25 1.25 6.06294 1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25ZM7.53044 11.9697C7.23755 11.6768 6.76268 11.6768 6.46978 11.9697C6.17689 12.2626 6.17689 12.7374 6.46978 13.0303L9.46978 16.0303C9.76268 16.3232 10.2376 16.3232 10.5304 16.0303L17.5304 9.03033C17.8233 8.73744 17.8233 8.26256 17.5304 7.96967C17.2375 7.67678 16.7627 7.67678 16.4698 7.96967L10.0001 14.4393L7.53044 11.9697Z"
                  fill="currentColor"
                ></path>
              </svg>
            </span>
            <div className="w-full text-sm font-sans leading-none m-1.5">
              {title}
            </div>
          </div>
        );
      case "FALSE":
        return (
          <div
            role="alert"
            className="relative flex items-start w-full border p-2 rounded-none border-b-0 border-l-4 border-r-0 border-t-0 border-red-500 bg-red-500/10 font-medium text-red-500"
          >
            <span className="grid place-items-center shrink-0 p-1">
              <svg
                width="1.5em"
                height="1.5em"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_160_1190)">
                  <path
                    d="M14.3981 13.1019L12.2962 11L14.3981 8.89808C14.7565 8.53967 14.7565 7.96033 14.3981 7.60192C14.2193 7.42317 13.9847 7.33333 13.75 7.33333C13.5153 7.33333 13.2807 7.42317 13.1019 7.60192L11 9.70383L8.89808 7.60192C8.71933 7.42317 8.48467 7.33333 8.25 7.33333C8.01533 7.33333 7.78067 7.42317 7.60192 7.60192C7.2435 7.96033 7.2435 8.53967 7.60192 8.89808L9.70383 11L7.60192 13.1019C7.2435 13.4603 7.2435 14.0397 7.60192 14.3981C7.96033 14.7565 8.53967 14.7565 8.89808 14.3981L11 12.2962L13.1019 14.3981C13.4603 14.7565 14.0397 14.7565 14.3981 14.3981C14.7565 14.0397 14.7565 13.4603 14.3981 13.1019ZM22 11C22 4.93442 17.0656 0 11 0C4.93442 0 0 4.93442 0 11C0 17.0656 4.93442 22 11 22C17.0656 22 22 17.0656 22 11ZM20.1667 11C20.1667 16.0545 16.0545 20.1667 11 20.1667C5.9455 20.1667 1.83333 16.0545 1.83333 11C1.83333 5.9455 5.9455 1.83333 11 1.83333C16.0545 1.83333 20.1667 5.9455 20.1667 11Z"
                    fill="#FA5343"
                  />
                </g>
              </svg>
            </span>
            <div className="w-full text-sm font-sans leading-none m-1.5">
              {title}
            </div>
          </div>
        );
      default:
        return (
          <div
            role="alert"
            className="relative flex items-start w-full border p-2 rounded-none border-b-0 border-l-4 border-r-0 border-t-0 border-amber-500 bg-amber-500/10 font-medium text-amber-500"
          >
            <span className="grid place-items-center shrink-0 p-1">
              <svg
                width="1.5em"
                height="1.5em"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.9999 13V7C10.9999 6.45 11.4499 6 11.9999 6C12.5499 6 12.9999 6.45 12.9999 7V13C12.9999 13.55 12.5499 14 11.9999 14C11.4499 14 10.9999 13.55 10.9999 13ZM11.9999 15C11.1699 15 10.4999 15.67 10.4999 16.5C10.4999 17.33 11.1699 18 11.9999 18C12.8299 18 13.4999 17.33 13.4999 16.5C13.4999 15.67 12.8299 15 11.9999 15ZM23.5799 19.88C22.8799 21.23 21.4099 22 19.5699 22H4.4399C2.5899 22 1.1299 21.23 0.429904 19.88C-0.280096 18.52 -0.0800958 16.78 0.929904 15.32L8.9699 2.6C9.6799 1.58 10.7999 1 11.9999 1C13.1999 1 14.3199 1.58 14.9999 2.57L23.0799 15.34C24.0899 16.8 24.2799 18.53 23.5699 19.88H23.5799ZM21.4299 16.46C21.4299 16.46 21.4099 16.44 21.4099 16.42L13.3399 3.67C13.0499 3.26 12.5499 3 11.9999 3C11.4499 3 10.9499 3.26 10.6399 3.71L2.5899 16.42C1.9699 17.3 1.8299 18.26 2.1899 18.95C2.5399 19.63 3.3399 20 4.4299 20H19.5499C20.6399 20 21.4399 19.63 21.7899 18.95C22.1499 18.26 22.0099 17.3 21.4199 16.46H21.4299Z"
                  fill="#FF8C00"
                />
              </svg>
            </span>
            <div className="w-full text-sm font-sans leading-none m-1.5">
              {title}
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {visible && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2"
          style={{ zIndex: 1000 }}
        >
          <div className="max-w-xs text-xs shadow-lg rounded bg-white/90">
            {renderbgColor()}
          </div>
        </div>
      )}
    </>
  );
};

export default forwardRef(SnackBarModal);
