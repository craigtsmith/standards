/* oxlint-disable eslint/class-methods-use-this, eslint/no-unused-private-class-members, standards/no-unknown-parameters, standards/no-unsafe-dictionary-type, standards/no-shape-in-symbol-names, eslint/max-lines -- a probe; only sort-classes matters here */

type Fn = () => void
type Reader = (key: string) => string | undefined

abstract class Base {
  label = ""
  weight = 0

  get size(): number {
    return this.weight
  }
  get title(): string {
    return this.label
  }

  describe(): string {
    return this.label
  }

  measure(): number {
    return this.weight
  }
}
/**
 * Test Class for sorting
 */
export abstract class Probe extends Base {
  [index: number]: string
  [key: string]: unknown

  protected abstract protectedAbstractPath: string
  protected abstract protectedAbstractSlots: number
  abstract abstractTarget: string
  abstract abstractThreshold: number

  protected abstract protectedAbstractClose(): void
  protected abstract protectedAbstractOpen(path: string): void
  abstract abstractRun(): void
  abstract abstractStop(reason: string): void

  static #privateStaticHashRegistry = new Map<string, number>()
  static #privateStaticHashVersion = 3
  private static accessor privateStaticAccessorDepth = 1
  private static accessor privateStaticAccessorOwner = "nobody"
  private static privateStaticCache: string[] = []
  private static privateStaticFlag = false

  private readonly privateReadonlyOrigin = "local"
  private readonly privateReadonlySeed = 42
  #privateHashCount = 1
  #privateHashName = "hash"
  private accessor privateAccessorMode = "idle"
  private accessor privateAccessorTicks = 0
  private privateColour = "red"
  private privateLimit = 10
  private privateOptionalNote?: string
  private privateOptionalRetries?: number

  protected static accessor protectedStaticAccessorPool = 4
  protected static accessor protectedStaticAccessorRegion = "eu"
  protected static protectedStaticDefaults = { retries: 3 }
  protected static protectedStaticScheme = "https"

  protected readonly protectedReadonlyKind = "probe"
  protected readonly protectedReadonlyRank = 2
  protected accessor protectedAccessorPhase = "boot"
  protected accessor protectedAccessorTurns = 0
  protected protectedHost = "localhost"
  protected protectedOptionalAlias?: string
  protected protectedOptionalTimeout?: number
  protected protectedPort = 4321

  static readonly staticReadonlyKind = "class"
  static readonly staticReadonlyMax = 99
  static accessor staticAccessorInstances = 0
  static accessor staticAccessorTheme = "light"
  static staticEpoch = 0
  static staticNamespace = "probe"

  readonly readonlyId = "probe-1"
  readonly readonlyStamp = 1700000000
  accessor accessorState = "ready"
  accessor accessorTotal = 0
  colour = "blue"
  count = 0
  declare declareBrand: string
  declare declareShape: { sides: number }
  @decorated accessor decoratedAccessorLevel = 1
  @logged accessor decoratedAccessorTag = "x"
  @decorated decoratedBadge = "gold"
  @logged decoratedTally = 7
  override label = "probe"
  optionalHint?: string
  optionalScore?: number
  public publicHeight = 100
  public publicWidth = 200
  override weight = 1

  static {
    Probe.staticEpoch = Date.now()
  }
  static {
    Probe.#privateStaticHashRegistry.set("boot", Probe.#privateStaticHashVersion)
  }

  constructor(
    readonly parameterProperty: number,
    private readonly parameterSecret: string
  ) {
    super()
  }

  private static get privateStaticEnabled(): boolean {
    return Probe.privateStaticFlag
  }
  private static set privateStaticEnabled(value: boolean) {
    Probe.privateStaticFlag = value
  }
  private static get privateStaticEntries(): string[] {
    return Probe.privateStaticCache
  }
  private static set privateStaticEntries(value: string[]) {
    Probe.privateStaticCache = value
  }

  private get privateColourName(): string {
    return this.privateColour
  }
  private set privateColourName(value: string) {
    this.privateColour = value
  }
  private get privateMaximum(): number {
    return this.privateLimit
  }
  private set privateMaximum(value: number) {
    this.privateLimit = value
  }

  protected static get protectedStaticRetries(): number {
    return Probe.protectedStaticDefaults.retries
  }
  protected static set protectedStaticRetries(value: number) {
    Probe.protectedStaticDefaults = { retries: value }
  }
  protected static get protectedStaticUrlScheme(): string {
    return Probe.protectedStaticScheme
  }
  protected static set protectedStaticUrlScheme(value: string) {
    Probe.protectedStaticScheme = value
  }

  protected get protectedAddress(): string {
    return `${this.protectedHost}:${this.protectedPort}`
  }
  protected set protectedAddress(value: string) {
    this.protectedHost = value
  }
  protected get protectedPortNumber(): number {
    return this.protectedPort
  }
  protected set protectedPortNumber(value: number) {
    this.protectedPort = value
  }

  static get staticCurrent(): number {
    return Probe.staticEpoch
  }
  static set staticCurrent(value: number) {
    Probe.staticEpoch = value
  }
  static get staticName(): string {
    return Probe.staticNamespace
  }
  static set staticName(value: string) {
    Probe.staticNamespace = value
  }

  get area(): number {
    return this.publicHeight * this.publicWidth
  }
  set area(value: number) {
    this.publicWidth = value / this.publicHeight
  }
  get colourName(): string {
    return this.colour
  }
  set colourName(value: string) {
    this.colour = value
  }
  @decorated get decoratedBadgeName(): string {
    return this.decoratedBadge
  }
  @logged get decoratedTallyValue(): number {
    return this.decoratedTally
  }
  override get size(): number {
    return this.weight * 2
  }
  override get title(): string {
    return this.label.toUpperCase()
  }

  static #privateStaticHashReset(): void {
    Probe.#privateStaticHashRegistry.clear()
  }

  static #privateStaticHashStamp(): number {
    return Probe.#privateStaticHashVersion
  }

  private static privateStaticPrime(): void {
    Probe.privateStaticCache = ["a"]
  }

  private static privateStaticToggle(): void {
    Probe.privateStaticFlag = !Probe.privateStaticFlag
  }

  private static privateStaticFunctionClear: Fn = () => {}
  private static privateStaticFunctionRead: Reader = (key) => key

  protected static protectedStaticConfigure(retries: number): void {
    Probe.protectedStaticDefaults = { retries }
  }

  protected static protectedStaticSecure(): void {
    Probe.protectedStaticScheme = "https"
  }

  protected static protectedStaticFunctionPing: Fn = () => {}
  protected static protectedStaticFunctionRead: Reader = () => undefined

  static async staticAsyncLoad(): Promise<void> {
    await Promise.resolve()
  }

  static async staticAsyncWarm(): Promise<number> {
    return Promise.resolve(Probe.staticEpoch)
  }

  static staticCreate(count: number): number {
    return count + Probe.staticEpoch
  }

  static staticReset(): void {
    Probe.staticEpoch = 0
  }

  static staticFunctionNoop: Fn = () => {}
  static staticFunctionRead: Reader = (key) => key

  optionalHook?(): void
  optionalReport?(detail: string): string

  async asyncLoad(): Promise<void> {
    await Promise.resolve()
  }

  async asyncSave(): Promise<number> {
    return Promise.resolve(this.count)
  }

  @decorated decoratedTick(): void {
    this.count += 1
  }

  @logged decoratedTrace(message: string): string {
    return message
  }

  override describe(): string {
    return `probe ${this.label}`
  }

  grow(by: number): void {
    this.count += by
  }

  override measure(): number {
    return this.weight + this.count
  }

  public publicRender(): string {
    return this.colour
  }

  public publicReset(): void {
    this.count = 0
  }

  shrink(): void {
    this.count -= 1
  }

  functionArrowNoop: Fn = () => {}
  functionArrowRead: Reader = (key) => key
  functionExpressionNoop: Fn = function () {}
  functionExpressionRead: Reader = function (key) {
    return key
  }

  protected async protectedAsyncRetry(): Promise<void> {
    await Promise.resolve(this.protectedReadonlyRank)
  }

  protected async protectedAsyncWait(ms: number): Promise<number> {
    return Promise.resolve(ms)
  }

  protected protectedConnect(): string {
    return this.protectedAddress
  }

  protected protectedDisconnect(): void {
    this.protectedPort = 0
  }

  protected protectedFunctionPing: Fn = () => {}
  protected protectedFunctionRead: Reader = () => undefined

  #privateHashBump(): void {
    this.#privateHashCount += 1
  }

  #privateHashRename(name: string): void {
    this.#privateHashName = name
  }

  private async privateAsyncFlush(): Promise<void> {
    await Promise.resolve(this.privateReadonlySeed)
  }

  private async privateAsyncSync(): Promise<string> {
    return Promise.resolve(this.privateReadonlyOrigin)
  }

  private privateReset(): void {
    this.privateLimit = 0
  }

  private privateTint(colour: string): void {
    this.privateColour = colour
  }

  private privateFunctionClear: Fn = () => {}
  private privateFunctionRead: Reader = (key) => key
}

function decorated(_target: unknown, _context: unknown): void {}

function logged(_target: unknown, _context: unknown): void {}
