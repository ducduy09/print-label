import {
  Fragment,
  PureComponent,
} from "react";
import colors from "@setup_assets/color/colors";
import sizes from "@setup_assets/size/sizes";
import NetworkErrorManager from "@component/network/NetworkErrorManager";
import TextBaseTranslate from "@component/text/TextbaseTranslate";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

export function showNetworkError(
  contentNoti: string,
  callback?: () => void,
  option?: object,
  textNoTranslate?: boolean,
  isHideCloseButton?: boolean
) {
  const ref: any = NetworkErrorManager.getDefault();
  // const ref = React.useRef<any>(null)
  if (!!ref && !!ref.current) {
    ref.current.showModal(
      contentNoti,
      callback,
      option,
      textNoTranslate,
      isHideCloseButton
    );
  }
}

export function showError(
  contentNoti: string,
  callback?: () => void,
  option?: object,
  textNoTranslate?: boolean,
  isHideCloseButton?: boolean
) {
  const ref: any = NetworkErrorManager.getDefault();
  if (ref) {
    ref?.current?.showModal(
      contentNoti,
      callback,
      option,
      textNoTranslate,
      isHideCloseButton
    );
  }
}

export function hideNetworkError(callback?: () => void) {
  const ref = NetworkErrorManager.getDefault();
  if (ref) {
    ref?.current?.hideModal(callback);
  }
}

export function hideError(callback?: () => void) {
  const ref = NetworkErrorManager.getDefault();
  if (ref) {
    ref?.current?.hideModal(callback);
  }
}

interface IStates {
  visible: boolean;
  callback: (() => void) | undefined;
  contentNoti: string;
  option: object | undefined;
  textNoTranslate: boolean;
  isShowCloseButton?: boolean;
}

interface IProps {}

class NetworkErrorModal extends PureComponent<IProps, IStates> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      visible: false,
      callback: () => {},
      contentNoti: "",
      option: {},
      textNoTranslate: false,
      isShowCloseButton: false,
    };
  }

  showModal = (
    content: string,
    action?: () => void,
    option?: object,
    textNoTranslate?: boolean,
    isHideCloseButton?: boolean
  ) => {
    if (!this.state.visible) {
      this.setState({
        contentNoti: content,
        callback: action,
        visible: true,
        option,
        textNoTranslate: textNoTranslate || false,
        isShowCloseButton: isHideCloseButton,
      });
    }
  };

  hideModal = () => {
    const { callback } = this.state;
    this.setState({ visible: false });
    callback && callback();
  };

  render() {
    const { visible, contentNoti, option, textNoTranslate } = this.state;
    return (
      <Transition appear show={visible} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={this.hideModal}>
          {/* lam mo nen dang sau */}
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <DialogTitle
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-6"
                  >
                    <TextBaseTranslate text={"notify"} IStyles={styles.title} />
                  </DialogTitle>
                  <div className="mt-2">
                    <div className="text-sm text-gray-500">
                      {!textNoTranslate && (
                        <TextBaseTranslate
                          text={contentNoti}
                          IStyles={styles.contentNoti}
                          option={option}
                        />
                      )}
                      {textNoTranslate && (
                        <TextBaseTranslate
                          text={contentNoti}
                          IStyles={styles.contentNoti}
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => {
                        // handleCreateJob()
                        this.hideModal();
                      }}
                    >
                      <TextBaseTranslate text="confirm" IStyles={{color: colors.white}}/>
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }
}

export default NetworkErrorModal;

const styles = {
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bgColorRating,
    paddingHorizontal: sizes._25sdp,
  },
  content: {
    backgroundColor: colors.white,
    width: "100%",
    borderRadius: sizes._14sdp,
  },
  groupTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: sizes._5sdp,
    paddingLeft: sizes._15sdp,
    backgroundColor: "#B9EAFB",
    borderTopRightRadius: sizes._14sdp,
    borderTopLeftRadius: sizes._14sdp,
  },
  title: {
    fontSize: sizes._16sdp,
    fontWeight: "700",
    color: "#1E40AF",
  },
  contentNoti: {
    color: colors.gray828282,
    marginTop: sizes._10sdp,
    textAlign: "center",
    marginHorizontal: sizes._15sdp,
  },
  btnStyle: {
    marginTop: sizes._35sdp,
    marginHorizontal: sizes._15sdp,
    marginBottom: sizes._15sdp,
  },
  buttonClose: {
    position: "absolute",
    right: sizes._20sdp,
    top: sizes._20sdp,
  },
  iconClose: {
    height: sizes._15sdp,
    width: sizes._15sdp,
    resizeMode: "contain",
    tintColor: colors.purple582E91,
  },
  groupClose: {
    paddingHorizontal: sizes._15sdp,
    paddingVertical: sizes._10sdp,
  },
};
