import React, { useMemo, useState } from 'react'
import images from '@setup_assets/image/images'
import { useSelector } from 'react-redux';
import sizes from '@setup_assets/size/sizes';

interface HeaderBgImageProps{
    children: React.ReactNode | React.ReactNode[];
    image: string;
}

function HeaderBGImage(props: HeaderBgImageProps) {

    // const bgImage = useSelector((state: any) => state.bgImageReducer);
    // const image = useMemo(() => {
    //   if (!!bgImage && !!bgImage.image) return bgImage.image;
    //   else return images.background_light;
    // }, [bgImage]);

  return (
    <>
      <img src={props.image} style={styles.background} />
      <img
        src={images.logo}
        className="absolute w-32 -top-4 left-8 "
      />
      {props.children}
    </>
  );
}

export default HeaderBGImage


const styles: any = {
  background: {
    width: '100%',
    height: '100vh', // Đảm bảo chiều cao phù hợp với viewport
    objectFit: 'cover', // Thay thế resizeMode bằng objectFit
  },
};