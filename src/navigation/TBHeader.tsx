import React, {useMemo} from 'react';
import {useAppStackNavigation} from './appNavigation';
import {Text, View} from 'react-native';
import {StackHeaderProps} from '@react-navigation/stack';
import {IconButton} from 'react-native-paper';

type TBHeaderProps = {
  backButton?: boolean;
  onBackPress?: () => void;
  closeButton?: boolean;
  onClosePress?: () => void;
} & StackHeaderProps;

export function TBHeader({
  backButton,
  // onBackPress,
  closeButton,
  onClosePress,
  navigation,
  options,
  route,
}: TBHeaderProps): JSX.Element {
  const stackNavigator = useAppStackNavigation();

  const headerLeftRightProps = useMemo(
    () => ({
      canGoBack: stackNavigator.canGoBack(),
      // tintColor: colors.white0,
      label: options.title || route.name,
    }),
    [options.title, route.name, stackNavigator],
  );

  const left = useMemo(() => {
    if (backButton) {
      return (
        // <IconButton
        //   icon={<ChevronLeftIcon name="close" color={colors.white.primary} />}
        //   backgroundColor={colors.background}
        //   onPress={() => {
        //     if (onBackPress != undefined) {
        //       onBackPress();
        //     } else {
        //       navigation.goBack();
        //     }
        //   }}
        // />
        <IconButton
          icon="arrow-left"
          size={20}
          onPress={() => {
            if (onClosePress != null) {
              onClosePress();
            } else {
              navigation.goBack();
            }
          }}
        />
      );
    }

    return options.headerLeft != null ? (
      options.headerLeft(headerLeftRightProps)
    ) : closeButton == null ? (
      // <Box marginLeft={5}>
      //   <ElectronMintLogo />
      // </Box>
      <Text>tinybooth logo</Text>
    ) : undefined;
  }, [
    backButton,
    closeButton,
    headerLeftRightProps,
    navigation,
    onClosePress,
    options,
  ]);

  const title = useMemo(() => {
    if (typeof options.headerTitle === 'string') {
      if (closeButton && left == null) {
        // TODO: make this big and bold
        return <Text>{options.headerTitle}</Text>;
      }
      return <Text>{options.headerTitle}</Text>;
    } else if (options.headerTitle != null) {
      return options.headerTitle({
        children: options.title || route.name || 'N/A',
      });
    }

    if (options.title != null) {
      if (closeButton && left == null) {
        // TODO: make this big and bold
        return <Text>{options.title}</Text>;
      }
      return <Text>{options.title}</Text>;
    }

    return undefined;
  }, [closeButton, left, options, route.name]);

  const right = useMemo(() => {
    if (closeButton) {
      return (
        // <IconButton
        //   backgroundColor={colors.grey.dark}
        //   marginRight={5}
        //   padding={3}
        //   borderRadius="100px"
        //   icon={
        //     <CloseIcon color={colors.white.primary} opacity={0.7} size="sm" />
        //   }
        //   // borderRadius="full"
        //   onPress={() => {
        //     if (onClosePress != undefined) {
        //       onClosePress();
        //     } else {
        //       navigation.goBack();
        //     }
        //   }}
        // />
        <IconButton
          icon="close"
          size={20}
          onPress={() => {
            if (onClosePress != null) {
              onClosePress();
            } else {
              navigation.goBack();
            }
          }}
        />
      );
    }
    return options.headerRight != null
      ? options.headerRight(headerLeftRightProps)
      : undefined;
  }, [closeButton, headerLeftRightProps, navigation, onClosePress, options]);

  if (closeButton && left == null) {
    // return (
    //   <>
    //     <Box safeAreaTop bg={colors.background}>
    //       <HStack
    //         paddingTop="2.5"
    //         // justifyContent="space-between"
    //         alignItems="center"
    //         width="100%">
    //         <Box width={'5/6'} paddingLeft={5} marginTop={10}>
    //           {title}
    //         </Box>
    //         <Box width={'1/6'} alignItems="flex-end">
    //           {right}
    //         </Box>
    //       </HStack>
    //     </Box>
    //   </>
    // );
    return (
      <>
        <View>
          <View>
            <View>{title}</View>
            <View>{right}</View>
          </View>
        </View>
      </>
    );
  }

  // return (
  //   <>
  //     <Box
  //       safeAreaTop
  //       bg={colors.background}
  //       borderBottomColor={colors.borderGrey}
  //       borderBottomWidth={1}>
  //       <HStack
  //         py="2.5"
  //         justifyContent="space-between"
  //         alignItems="center"
  //         justifyItems={'center'}
  //         width="100%">
  //         <Box width={'1/6'}>{left}</Box>
  //         <Box width={'4/6'} alignItems="center">
  //           {title}
  //         </Box>
  //         <Box width={'1/6'} alignItems="flex-end">
  //           {right}
  //         </Box>
  //       </HStack>
  //     </Box>
  //   </>
  // );

  return (
    <>
      <View>
        <View>
          <View>{left}</View>
          <View>{title}</View>
          <View>{right}</View>
        </View>
      </View>
    </>
  );
}
