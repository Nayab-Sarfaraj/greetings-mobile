import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Linking, Share } from "react-native";

export async function shareCreation(fileUrl?: string, linkUrl?: string) {
  if (!fileUrl) {
    if (linkUrl) await Share.share({ message: linkUrl, url: linkUrl });
    return;
  }
  const destination = new Directory(Paths.cache, "greetings-exports");
  destination.create({ idempotent: true, intermediates: true });
  const file = await File.downloadFileAsync(fileUrl, destination);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      dialogTitle: "Share your greeting",
      mimeType: "video/mp4",
      UTI: "public.mpeg-4",
    });
    return;
  }
  if (linkUrl) await Linking.openURL(linkUrl);
}
