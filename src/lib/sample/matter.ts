import type { MatterDocuments } from "@/lib/ai/context";

/** Fictional published-style application for demo (not a real filing). */
export const sampleMatter: MatterDocuments = {
  applicationNumber: "17/456,789",
  title: "Adaptive thermal management for inductive charging surfaces",
  claims: `1. A wireless power transfer apparatus comprising:
a charging coil configured to deliver power to a receiver coil of an external device;
a temperature sensor thermally coupled to the charging coil;
a controller communicatively coupled to the temperature sensor and configured to:
monitor a temperature signal from the temperature sensor;
reduce a power level delivered by the charging coil when the temperature signal exceeds a first threshold; and
resume the power level when the temperature signal falls below a second threshold lower than the first threshold.

2. The apparatus of claim 1, wherein the controller is further configured to modulate a duty cycle of the charging coil to reduce the power level.

3. The apparatus of claim 1, further comprising a fan directed at the charging coil, and wherein the controller activates the fan when the temperature signal exceeds the first threshold.

4. The apparatus of claim 1, wherein the second threshold is at least five degrees Celsius below the first threshold.`,
  specification: `FIELD
The disclosure relates to inductive charging pads and thermal safety.

BACKGROUND
Consumer inductive chargers can overheat when misaligned receivers draw excess current. Conventional pads throttle abruptly or shut down entirely, causing user frustration.

SUMMARY
In one aspect, a charging apparatus uses hysteresis between throttle-on and throttle-off temperature thresholds so power ramps smoothly while keeping coil temperature within safe limits.

DETAILED DESCRIPTION
FIG. 1 shows pad 100 with coil 110, sensor 120, controller 130, and optional fan 140. Controller 130 samples sensor 120 at 10 Hz. When temperature T exceeds threshold T_high (e.g., 45 °C), controller 130 reduces delivered power by lowering duty cycle or input current. When T falls below T_low (e.g., 40 °C), full power is restored. Separating T_low from T_high avoids oscillation at the boundary.

In embodiments combining claims 2–3, fan 140 augments passive cooling during high-load sessions. Software in controller 130 may log thermal events for diagnostics.`,
  references: [
    {
      id: "ref-smith",
      label: "Smith et al.",
      title: "Temperature-aware power control for inductive chargers (US 9,100,000)",
      body: `[0001] Inductive charging systems convert AC power into a magnetic field coupled to a receiver.

[0002] FIG. 2 depicts charger 200 with primary coil 210 and thermistor 220 mounted on the coil substrate.

[0003] Controller 230 reads thermistor 220 and compares temperature to a single cutoff T_max of 50 °C.

[0004] When temperature exceeds T_max, controller 230 disables the coil until temperature drops below T_max minus 2 °C, then re-enables at full power.

[0005] Smith does not describe separate high and low thresholds with intentional hysteresis bands for gradual power reduction; shutdown is binary.`,
    },
    {
      id: "ref-chen",
      label: "Chen",
      title: "Duty-cycle modulation for Qi transmitters (US 10,200,000)",
      body: `[0010] A Qi-compatible transmitter adjusts duty cycle of the power signal to limit average power delivery.

[0011] Duty cycle values between 30% and 100% map to requested power classes.

[0012] Temperature is not sensed locally; modulation follows negotiation packets from the receiver.

[0013] Chen teaches gradual power reduction via duty cycle but does not combine local coil temperature sensing with hysteresis-based resume thresholds.`,
    },
  ],
};
