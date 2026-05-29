# 6. RESULT ANALYSIS

The Result Analysis chapter explains the performance and output obtained from the implementation of the Temperature Monitoring and Alert System using ESP32. The system was successfully tested under different temperature conditions to verify the proper operation of the DHT22 temperature sensor, ESP32 microcontroller, and buzzer alert mechanism. The project demonstrated reliable temperature monitoring and immediate alert generation whenever the temperature exceeded the predefined threshold value.

The DHT22 sensor continuously monitored the environmental temperature and transmitted the readings to the ESP32 controller. The ESP32 successfully processed the sensor data and compared the temperature values with the programmed threshold condition. During testing, whenever the temperature crossed the threshold limit, the buzzer was activated automatically to notify the user about the abnormal temperature condition. The system also displayed real-time temperature readings on the Serial Monitor continuously.

The project was tested under normal room temperature conditions as well as elevated temperature conditions using external heat sources. The observed results confirmed that the system responded correctly and generated alerts immediately after detecting high temperature values. The buzzer remained OFF during normal temperature conditions and turned ON automatically whenever the temperature exceeded the threshold value.

---

## 6.1 Results

The following observations were recorded during the testing of the system:

-------- -------------------------------- --------------- -------------------------
 Sl. No   Temperature Condition            Buzzer Status  System Response
-------- -------------------------------- --------------- -------------------------
 1        Temperature below threshold      OFF            Normal monitoring
 
 2        Temperature equal to threshold   OFF            Continuous monitoring
 
 3        Temperature above threshold      ON             Alert generated
 
 4        Sensor disconnected              OFF            Error message displayed
-------- -------------------------------- --------------- -------------------------

Table 6.1: Result Observations

The obtained results indicate that the proposed system performs reliable temperature monitoring and alert generation. The ESP32 controller successfully processed the temperature data from the DHT22 sensor and activated the buzzer whenever the threshold condition was satisfied.

---

## 6.2 Performance Analysis

The implemented system provides the following advantages:

- Continuous real-time temperature monitoring
- Immediate alert generation during abnormal conditions
- Low-cost implementation using simple hardware components
- Easy installation and operation
- Reliable and efficient system performance
- Reduced manual monitoring effort

The DHT22 sensor provided stable and accurate temperature readings throughout the testing process. The ESP32 microcontroller responded quickly to temperature changes and activated the buzzer without noticeable delay. The system consumed very low power and operated efficiently during continuous monitoring.

---

## 6.3 Snapshots

The following snapshots were captured during the implementation and testing of the project:

- Hardware setup of ESP32, DHT22 sensor, and buzzer
- Breadboard circuit connections
- Serial Monitor displaying temperature readings
- Buzzer activation during high temperature condition
- Arduino IDE program upload screen

![Figure 6.1: Hardware Setup of Proposed System](assets/images/result.png){width=5in height=3.5in}

![Figure 6.2: Circuit Connection of ESP32 and DHT22](assets/images/result.png){width=5in height=3.5in}

![Figure 6.3: Serial Monitor Output](assets/images/result.png){width=5in height=3.5in}

![Figure 6.4: Buzzer Alert during High Temperature Detection](assets/images/result.png){width=5in height=3.5in}

---

The successful execution and testing of the proposed system demonstrate that the Temperature Monitoring and Alert System using ESP32 provides an effective and reliable solution for real-time temperature monitoring applications.

\newpage