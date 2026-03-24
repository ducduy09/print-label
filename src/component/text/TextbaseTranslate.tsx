import i18next from 'i18next';
import * as React from 'react';
import colors from '@setup_assets/color/colors';
import sizes from '@setup_assets/size/sizes';

interface TextBaseTranslateProps {
  text: string;
  IStyles?: any;
  className?: string;
  IProps?: React.HTMLAttributes<HTMLElement>;
  children?: React.ReactNode | React.ReactNode[];
  option?: Record<string, any>;
  numberOfLines?: number;
  isIncludeColon?: boolean;
  isIncludeExclamationMark?: boolean;
  isIncludeDot?: boolean;
  star?: boolean;
  checkLine?: (line: number) => void;
  unTranslate?: boolean;
}

const TextBaseTranslate: React.FC<TextBaseTranslateProps> = ({
  text,
  IStyles,
  IProps,
  className,
  children,
  option = {},
  numberOfLines,
  isIncludeColon,
  isIncludeExclamationMark,
  isIncludeDot,
  star,
  checkLine,
  unTranslate,
}) => {
  // const onTextLayout = React.useCallback(
  //   (e: any) => checkLine?.(e.nativeEvent.lines.length),
  //   [checkLine]
  // );

  const translatedText = !!unTranslate ? text : i18next.t(text ?? '', option);

  const punctuation = [
    isIncludeColon ? ': ' : '',
    isIncludeExclamationMark ? '!' : '',
    isIncludeDot ? '.' : '',
  ].join('');

  return (
    <div
      className={className}
      style={{ ...styles.text, ...IStyles }}
      aria-rowcount={numberOfLines}
      {...IProps}
    >
      {translatedText + punctuation}
      {children}
      {star && <p style={styles.star}> *</p>}
    </div>
  );
};

export default TextBaseTranslate;

const styles = {
  text: {
    // fontSize: "14px",
  },
  star: {
    color: colors.redEB5757,
    marginLeft: sizes._3sdp,
  },
};
