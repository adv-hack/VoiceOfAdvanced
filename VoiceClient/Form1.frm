VERSION 5.00
Begin VB.Form Form1 
   Caption         =   "Form1"
   ClientHeight    =   3030
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   4560
   LinkTopic       =   "Form1"
   ScaleHeight     =   3030
   ScaleWidth      =   4560
   StartUpPosition =   3  'Windows Default
   Begin VB.CommandButton Command2 
      Caption         =   "Initialize"
      Height          =   495
      Left            =   1920
      TabIndex        =   1
      Top             =   1800
      Width           =   1455
   End
   Begin VB.CommandButton Command1 
      Caption         =   "TestAudio"
      Height          =   495
      Left            =   360
      TabIndex        =   0
      Top             =   1800
      Width           =   1455
   End
End
Attribute VB_Name = "Form1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit
Dim WithEvents obj As AdvancedVoice.VoiceController
Attribute obj.VB_VarHelpID = -1

Private Sub Command1_Click()
obj.TestCallBack
End Sub

Private Sub Command2_Click()
On Error Resume Next
Call obj.ConfigureGrammar
Call obj.Initialize

End Sub

Private Sub Form_Load()
Set obj = New AdvancedVoice.VoiceController

Dim arr(2) As String
arr(0) = "Call"
arr(1) = "Client"
arr(2) = "SOP"

Call obj.SetVoiceChoices(arr)
End Sub

Private Sub obj_OnUserSpeakCommand(ByVal command As String)
MsgBox command
End Sub
