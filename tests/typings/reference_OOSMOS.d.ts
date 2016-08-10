interface iState {
    ENTER?: () => void;
    EXIT?: () => void;
    TIMEOUT?: () => void;
    COMPOSITE?: iComposite | (() => iComposite);
    [EventString: string]: (() => void) | any;
    DOTPATH?: string;
}
interface iComposite {
    DEFAULT?: string;
    [StateName: string]: iState | (() => iState) | any;
}
declare class StateMachine {
    private m_ROOT;
    private m_State;
    private m_Timeouts;
    private m_Interval;
    private m_EventSourceState;
    private m_DotPath2State;
    private m_DebugMode;
    private m_InBrowser;
    private m_DebugID;
    private m_LinesOut;
    private m_MaxLinesOut;
    private m_ScrollIntoView;
    constructor(Composite: iComposite);
    private InstrumentStateMachine();
    private StripROOT(StateName);
    private EnterDefaultStates(Composite);
    private CalculateLCA(StringA, StringB);
    Transition(To: string, ...Args: any[]): void;
    Start(): void;
    Restart(): void;
    IsIn(StateDotPath: string): boolean;
    Event(EventString: string, ...Args: any[]): void;
    SetTimeoutSeconds(TimeoutSeconds: number): void;
    DebugPrint(Message: string): void;
    SetDebug(DebugMode: boolean, DebugID?: string, MaxLinesOut?: number, ScrollIntoView?: boolean): void;
    Print(Message: string): void;
    Assert(Condition: boolean, Message: string): void;
    Alert(Message: string): void;
}
