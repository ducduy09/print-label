import * as React from 'react';
import colors from '@setup_assets/color/colors';
import SVGS from '@setup_assets/image/svgs';
import sizes from '@setup_assets/size/sizes';
import NavigationService from '@navigator/NavigationService';
import {Home} from '@navigator/screenNames';
import TextBaseTranslate from '../text/TextbaseTranslate';
import { useEffect } from 'react';
import Modal from "react-bootstrap/Modal";
import "react-datepicker/dist/react-datepicker.css";
// import { getMessaging } from '@react-native-firebase/messaging';
// import { getApp } from '@react-native-firebase/app';
import { DataUser } from '@type';

interface Props {
  dataMessage?: any;
  title?: string;
  content?: any;
}

const ModalNotification = (Props: Props, ref: any) => {
  const [visiable, setVisiable] = React.useState(false);
  const openModal = React.useCallback(() => {
    setVisiable(true);
  }, []);
  // const messaging = getMessaging(getApp());

  const closeModal = React.useCallback(() => {
    setVisiable(false);
  }, []);

  console.log(Props);
  

  useEffect(() => {
    // const unsubscribe = messaging.onMessage(async remoteMessage => {
    //   console.log('Received in foreground:', remoteMessage);

    //   // Cập nhật dữ liệu thông báo
    //   // setNotificationData({
    //   //   title: remoteMessage.notification?.title || 'Thông báo mới',
    //   //   body: remoteMessage.notification?.body || 'Bạn có một thông báo mới',
    //   // });

    //   // Hiển thị modal
    //   setVisiable(true);
    // });

    // return unsubscribe;
  }, []);
  const navigation = () => {
    // const navigation = React.useCallback(async () => {
    // switch (true) {
    // switch (!undefined && Props?.dataMessage?.type) {
    // case Props?.dataMessage?.type === 'notify':
    //   NavigationService.navigate(NotifyScreen);
    //   closeModal();
    //   break;
    // default:
    NavigationService.navigate(Home.NotifyScreen);
    closeModal();
    // break;
    // }
    // }, [Props?.dataMessage?.type])
  }

  React.useImperativeHandle(ref, () => ({
    openModal,
    closeModal,
  }));

  return (
    <Modal
      show={visiable}
      onHide={closeModal}
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <img src={SVGS.ic_bell} style={styles.img_notification} />
        {/* <Image source={images.ic_bell_notification} style={styles.img_notification} /> */}
        <button style={styles.btnClose} onClick={closeModal}>
          <SVGS.ic_close_modal />
          {/* <Image source={images.ic_ClosePopup} /> */}
        </button>
      </Modal.Header>
      <Modal.Body>
        <TextBaseTranslate
          text={"notification"}
          IStyles={[styles.text_notification]}
        />
        <p>{Props?.content}</p>
        <button
          title={"seeDetail"}
          // style={styles.btnView}
          onClick={() => navigation()}
        ></button>
      </Modal.Body>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.transparent,
  },
  body: {
    backgroundColor: colors.white,
    position: 'absolute',
    bottom: '35%',
    left: '5%',
    // height: sizes._130sdp,
    width: '90%',
    paddingHorizontal: sizes._10sdp,
    paddingBottom: sizes._10sdp
  },
  btnClose: {
    alignSelf: 'flex-start',
    marginTop: sizes._10sdp,
    marginRight: sizes._15sdp,
  },
  btnView: {
    paddingHorizontal: '30%'
  },
  rows: {
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  titlePopup: {
    marginTop: sizes._5sdp,
    fontWeight: '700',
    fontSize: sizes._16sdp,
    color: colors.purple462574,
  },
  notication: {
    marginTop: sizes._10sdp,
    alignItems: 'center',
    paddingHorizontal: sizes._15sdp
  },
  img_notification: {
    marginLeft: sizes._25sdp,
    marginTop: sizes._15sdp
  },
  text_notification: {
    marginBottom: sizes._10sdp,
    fontSize: sizes._14sdp,
    color: colors.purple462574,
    fontWeight: '700',
  },
  context: {
    flexDirection: 'row',
  },
  txtLeadID: {
    color: colors.gray828282,
    fontSize: sizes._13sdp,
  },
  txtValueID: {
    color: colors.purple462574,
    fontWeight: '400',
    marginLeft: sizes._3sdp,
    fontSize: sizes._13sdp,
  },
};

export default React.forwardRef(ModalNotification);
