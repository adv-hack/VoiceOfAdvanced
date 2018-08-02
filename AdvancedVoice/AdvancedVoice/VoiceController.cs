using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Speech.Recognition;
using System.Speech.Synthesis;
using System.Text;
using System.Threading.Tasks;

namespace AdvancedVoice
{
    //Interface will be implemented in VB client
    [ComVisible(true)]
    [InterfaceType(ComInterfaceType.InterfaceIsIDispatch)]
    public interface IVoiceActionEvents
    {
        void OnUserSpeakCommand(string command);
    }

    public interface IVoiceChoices
    {
        void SetVoiceChoices(ref string[] arr);
        void TestCallBack();
        void TalkBack(string strMessage);
        void Initialize();
        void ConfigureGrammar();
    }

    [ComVisible(false)]
    public delegate void PerformActionDelegate(string command);

    [ComSourceInterfaces(typeof(IVoiceActionEvents)),
        ClassInterface(ClassInterfaceType.None)]
    public class VoiceController : IVoiceChoices
    {
        private SpeechRecognitionEngine recEngine;
        private SpeechSynthesizer talkBack;
        private bool react;
        private string[] voiceCommands;
        public event PerformActionDelegate OnUserSpeakCommand;
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
        }

        public void TestCallBack()
        {
            talkBack.Speak("Welcome to Advanced Speech Engine");
            OnUserSpeakCommand?.Invoke("Himanshu");
        }

        public void TalkBack(string strMessage)
        {
            talkBack.SpeakAsync(strMessage);
        }

        public void Initialize()
        {
            try
            {
                recEngine.SetInputToDefaultAudioDevice();
                talkBack.SetOutputToDefaultAudioDevice();

                recEngine.SpeechRecognized += RecEngine_SpeechRecognized;
                TalkBack("Welcome to Advanced Voice Engine");
            }catch(Exception e)
            {
                throw new Exception("Check microphone and speaker is available and connected");
            }
        }

        private void RecEngine_SpeechRecognized(object sender, SpeechRecognizedEventArgs e)
        {
            var result = e.Result;
            float conf = e.Result.Confidence;
            if (conf < 0.60) return;
            switch (result.Text)
            {
                case "One Wakeup":
                    react = true;
                    break;
                case "One Sleep":
                    react = false;
                    break;
            }

            if (react)
            {
                var words = result.Words;
                TalkBack(result.Text);
                if (words.Count > 1)
                {
                    OnUserSpeakCommand?.Invoke(words[1].Text);
                }
            }

        }

        public void ConfigureGrammar()
        {
            if (voiceCommands.Length == 0)
                throw new Exception("There are no commands for grammer");

            Choices startStopChoices = new Choices(new string[] { "Wakeup", "Sleep" });
            GrammarBuilder EngineGrammarBuilder = new GrammarBuilder("One");
            EngineGrammarBuilder.Append(startStopChoices);

            Choices applicationCommands = new Choices(voiceCommands);
            GrammarBuilder gBuilder = new GrammarBuilder("Open");
            gBuilder.Append(applicationCommands);

            Choices combinedChoices = new Choices(new GrammarBuilder[] {EngineGrammarBuilder, gBuilder});
            Grammar grammar = new Grammar((GrammarBuilder)combinedChoices);
            grammar.Name = "AdvanceVoice";

            recEngine.LoadGrammar(grammar);
        }

        public void SetVoiceChoices(ref string[] arr)
        {
            voiceCommands = arr;
        }
    }
}
