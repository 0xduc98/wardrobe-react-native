import type { Paths } from '@/navigation/paths';
import type { StackScreenProps } from '@react-navigation/stack';

export type AuxiStackParamList = {
  [Paths.AiResult]: undefined;
  [Paths.EditContent]: undefined;
  [Paths.Favorites]: undefined;
  [Paths.Photo]: undefined;
};

export type RootScreenProps<
  S extends keyof RootStackParamList = keyof RootStackParamList,
> = StackScreenProps<RootStackParamList, S>;

export type RootStackParamList = {
  [Paths.Auxi]: undefined;
  [Paths.Example]: undefined;
  [Paths.Home]: undefined;
  [Paths.Chat]: undefined;
  [Paths.Login]: undefined;
  [Paths.Register]: undefined;
  [Paths.Startup]: undefined;
  [Paths.TestDetection]: undefined;
};
