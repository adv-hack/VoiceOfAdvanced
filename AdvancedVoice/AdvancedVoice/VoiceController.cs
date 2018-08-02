using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Runtime.InteropServices;
using System.Speech.Recognition;
using System.Speech.Synthesis;
using System.Text;
using System.Threading.Tasks;

namespace AdvancedVoice
{
    //Interface will be implemented in VB client
    [InterfaceType(ComInterfaceType.InterfaceIsIDispatch)]
    public interface IVoiceActionEvents
    {
        void UserSpeakCommand(string command);
    }

    public interface IVoiceChoices
    {
        string[] VoiceChoices { get; set; }
    }

    public delegate void PerformAction(string command);

    [ComSourceInterfaces("IVoiceActionEvents"),
        ClassInterface(ClassInterfaceType.None)]
    public class VoiceController : IVoiceChoices
    {
        private SpeechRecognitionEngine recEngine;
        private SpeechSynthesizer talkBack;
        private bool react;
        private string[] voiceCommands;

        /// <summary>
        /// Commands which will follow after Open
        /// </summary>
        public string[] VoiceChoices
        {
            get { return voiceCommands; }

            set { voiceCommands = value; }
        }

        public VoiceController()
        {
            CultureInfo ci = new CultureInfo("en-US");
            recEngine = new SpeechRecognitionEngine(ci);
            talkBack = new SpeechSynthesizer();
            recEngine.SetInputToDefaultAudioDevice();
            talkBack.SetOutputToDefaultAudioDevice();
        }

        public void TestCallBack()
        {
            talkBack.Speak("Welcome to Advanced Speech Engine");
        }

        public void Initialize()
        {
            
        }
    }
}
