// import * as FileSystem from "expo-file-system";

// async function uploadPhoto(uri: string) {
//   try {
//     // Read file as binary
//     const fileInfo = await FileSystem.getInfoAsync(uri);
//     if (!fileInfo.exists) throw new Error("File not found");

//     const formData = new FormData();
//     formData.append("photo", {
//       uri,
//       name: `photo_${Date.now()}.jpg`,
//       type: "image/jpeg",
//     } as any);

//     const response = await fetch("https://your-backend.com/upload", {
//       method: "POST",
//       body: formData,
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     });

//     const data = await response.json();
//     console.log("Upload response:", data);
//   } catch (error) {
//     console.error("Upload failed:", error);
//   }
// }


// export default uploadPhoto;