//this is for the library
// @ts-ignore: expo-speech may not be available in this environment or its types may be missing
import * as Speech from 'expo-speech';

/*
since i dont know how exacly the data from the json would look like i thought it may be something like:
detections:{object: door}, {object: chair}
*/

export default function speakObjects(objects: string | null) {
    if (!objects || objects.length === 0) {
        return;
    }

    // Create a sentence listing all detected objects
    const sentence = `${objects}.`;
    Speech.speak(sentence, { language: 'en', pitch: 1, rate: 1 });
}

// //test for expo app, it wont work with just basic execution
// if (require.main === module) {
//     const sampleData = {
//         detections: [
//             { object: "person" },
//             { object: "bottle" },
//             { object: "dog" }
//         ]
//     };

//     speakObjects(sampleData);
// }
