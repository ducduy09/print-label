import { DataUser } from './type';

export enum NotificationKey {
  CREATE_NEW_NOTIFICATION = 'CREATE_NEW_NOTIFICATION',
}
export const initFirebase = (
  dataUser: DataUser,
  changeMessage: (value: any) => void,
) => {
  checkPermission();
  onListenerFireMessaging(dataUser, changeMessage);
  // onNotificationOpenedApp();
  // getInitialNotification();
};

// const getInitialNotification = () => {
//   messaging()
//     .getInitialNotification()
//     .then((remoteMessage) => {
//       if (remoteMessage) {
//         console.log(
//           'Notification caused app to open from quit state:',
//           remoteMessage.notification,
//         );
//         // setInitialRoute(remoteMessage.data.type); // e.g. "Settings"
//       }
//     });
// };

const onNavigateScreen = async (
  // remoteMessage: FirebaseMessagingTypes.RemoteMessage,
  dataUser: DataUser,
) => {
  // if (remoteMessage && remoteMessage.data && remoteMessage.data.data) {
  //   let dataMessage: DataNotificaton = JSON.parse(remoteMessage.data.data);
  //   switch (dataMessage.type) {
  //     // case 'News':
  //     //   NavigationService.navigate(DetailSalesBoardScreen, {
  //     //     id: dataMessage.idAny,
  //     //   });
  //     //   break;
  //     // case 'comment':
  //     //   NavigationService.navigate(DetailSalesBoardScreen, {
  //     //     id: dataMessage.idAny,
  //     //   });
  //     //   break;
  //     case 'notify':
  //       NavigationService.navigate(NotifyScreen, {
  //         id: dataMessage.idAny,
  //       });
  //       break;
  //     default:
  //       NavigationService.navigate(NotifyScreen, {
  //         id: dataMessage.idAny,
  //       });
  //       break;
  //   }
  // }
};

const onListenerFireMessaging = (
  dataUser: DataUser,
  changeMessage: (value: any) => void,
) => {

// const messaging = getMessaging(getApp());
//   messaging.setBackgroundMessageHandler(
//     async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
//       console.log('=========> setBackgroundMessageHandler: ', remoteMessage);
//       let dataMessage: DataNotificaton =
//         remoteMessage.data && JSON.parse(remoteMessage.data.data);
//       if (remoteMessage) {
//         if (dataMessage.type !== 'chatbot') {
//           console.log('dataMessage.type', dataMessage.type);

//           if (
//             dataMessage?.type === 'notify' 
//             // dataMessage?.type === 'NewProduct' ||
//             // dataMessage?.type === 'Activity' ||
//             // dataMessage?.type.includes('WARNING') ||
//             // dataMessage?.type === 'TRUSTED'
//           ) {
//             changeMessage(remoteMessage);
//           } else {
//             onNavigateScreen(remoteMessage, dataUser);
//           }
//         }
//       }
//     },
//   );

//   //Foreground
//   messaging.onMessage(
//     async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
//       console.log('=========> onMessage FIREBASE CLICKED: ', remoteMessage);
//       let dataMessage: DataNotificaton =
//         remoteMessage.data && JSON.parse(remoteMessage.data.data);
//       if (remoteMessage) {
//         changeMessage(remoteMessage);
//       }
//     },
//   );
//   // in background
//   messaging.onNotificationOpenedApp(
//     async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
//       console.log('=========> onNotificationOpenedApp: ', remoteMessage);
//       if (remoteMessage?.data?.data) {
//         let dataMessage: DataNotificaton = JSON.parse(remoteMessage.data.data);
//         console.log('dataMessage.type', dataMessage.type);
//         if (dataMessage.type) {
//           let isLoggedin = DataSingleton.getData(
//             DataSingletonKey.IS_LOGGEDIN,
//             false,
//           );
//           if (isLoggedin) {
//             console.log('dataMessage.type', dataMessage.type);

//             switch (dataMessage.type) {
//               // case 'events':
//               //   NavigationService.navigate(DetailSalesBoardScreen, {
//               //     id: dataMessage.idAny,
//               //   });
//               //   break;
//               // case 'files':
//               //   NavigationService.navigate(DetailSalesBoardScreen, {
//               //     id: dataMessage.idAny,
//               //   });
//               //   break;
//               // case 'mails':
//               //   NavigationService.navigate(DetailSalesBoardScreen, {
//               //     id: dataMessage.idAny,
//               //   });
//               //   break;
//               case 'notify':
//                 NavigationService.navigate(NotifyScreen);
//                 break;
//               default:
//                 NavigationService.navigate(NotifyScreen);
//                 break;
//             }
//           } else {
//             DataSingleton.setData(
//               DataSingletonKey.IS_NOTIFICATION_SALES_BOARD,
//               dataMessage.idAny!!.toString(),
//             );
//           }
//         }
//       }
//     },
//   );

  // in  quit state
  // messaging
  //   .getInitialNotification()
  //   .then((remoteMessage: any) => {
  //     if (remoteMessage) {
  //       // onNavigateScreen(remoteMessage, dataUser);
  //       console.log(
  //         'Notification caused app to open from quit state ',
  //         JSON.stringify(remoteMessage),
  //       );
  //     }
  //   });
};

const checkPermission = async () => {
  
// const messaging = getMessaging(getApp());
  // messaging
  //   .hasPermission()
  //   .then((enabled: any) => {
  //     if (!enabled) {
  //       if (Platform.OS === 'ios') {
  //         messaging
  //         .requestPermission()
  //         .then(() => {
  //           // User has authorised
  //         })
  //         .catch(() => {
  //           // User has rejected permissions
  //         });
  //       }else{
  //         PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS')
  //       }
  //     }
  //   });
};

// sử dụng khi login ứng dụng, có token, lấy tokenFCM gửi lên server
export const getToken = async () => {
// const messaging = getMessaging(getApp());
  // messaging
  //   .getToken()
  //   .then(async (token: any) => {
  //     const tokenFcm = await AsyncStorage.getItem('fcmToken');
  //     console.log(tokenFcm);
      
  //     if (!tokenFcm) {
  //       await AsyncStorage.setItem('fcmToken', token);
  //       console.log('Device FCM: ', token);
  //       const response = await Api.postWithJson(
  //         NOTIFY.uploadFcmToken,
  //         {fcmToken: token},
  //         false,
  //       );
  //       console.log(response);
  //     } else {
  //       console.log('Device FCM: ', tokenFcm);
  //     }
  //   })
  //   .catch((e: any) => {
  //     console.log('getToken errr', e);
  //     // console.log('getToken errrss ',  UPLOAD_DEVICE.uploadFcm);
  //   });
};
