# SYSTEM DESIGN

The System Design chapter explains the structure and working model of the proposed Temperature Monitoring and Alert System using ESP32. The chapter describes how different hardware and software components are organized and connected to perform continuous temperature monitoring and automatic alert generation. The system is designed to monitor environmental temperature using the DHT22 sensor and activate a buzzer whenever the temperature exceeds a predefined threshold value.

The proposed system consists of three major sections: input section, processing section, and output section. The DHT22 sensor acts as the input component by continuously sensing the environmental temperature. The ESP32 microcontroller acts as the processing unit, which receives the temperature data from the sensor and compares it with the programmed threshold value. The buzzer acts as the output device and generates an alert sound whenever the temperature exceeds the safe limit. The temperature readings are also displayed on the Serial Monitor for real-time monitoring and analysis.

The system is designed using simple embedded system architecture to ensure reliable operation, low cost, and easy implementation. The overall workflow of the system includes sensor data collection, data processing, threshold comparison, and alert generation. The system operates continuously and provides immediate alerts during abnormal temperature conditions.

---

## System Architecture

The System Architecture explains the overall structure and interaction between the hardware and software components used in the project. The architecture of the proposed system mainly consists of DHT22 temperature sensor, ESP32 microcontroller, buzzer alert system, and Serial Monitor interface.

The DHT22 sensor continuously measures the surrounding temperature and sends the sensor readings to the ESP32 controller. The ESP32 processes the sensor data and compares the measured temperature value with the predefined threshold value stored in the program. If the temperature exceeds the threshold limit, the ESP32 activates the buzzer automatically to alert the user. The measured temperature values are simultaneously displayed on the Serial Monitor for monitoring and analysis purposes.

The proposed system uses direct communication between the sensor and the ESP32 microcontroller. Since the project is designed as a standalone embedded monitoring system, cloud storage and external servers are not used in the current implementation. However, the system can be upgraded in future to support IoT-based cloud monitoring and mobile notifications.

Figure 4.1 shows the overall system architecture of the Temperature Monitoring and Alert System using ESP32.

![System Architecture Diagram](assets/images/architecture.png){width=5in height=3.5in}

---

### 4.1.1 Component Specifications

----------- ------------------- ------------------
 Component   Parameter           Specification
----------- ------------------- ------------------
 DHT22       Voltage             3.3V to 5V
 
 DHT22       Temperature Range   -40°C to 80°C
 
 DHT22       Humidity Range      0% to 100%
 
 ESP32       Operating Voltage   3.3V
 
 ESP32       WiFi                802.11 b/g/n
----------- ------------------- ------------------

Table: Component Specifications

The architecture diagram clearly shows the flow of data from the DHT22 sensor to the ESP32 microcontroller. The ESP32 processes the input data and controls the buzzer output based on the temperature threshold condition. The Serial Monitor displays the real-time temperature values continuously.

---

## Data Flow Diagrams (DFD) / Flow Charts

This section explains the flow of information and operational sequence within the system. The Data Flow Diagram (DFD) and Flow Chart help in understanding how the system processes sensor data and generates output based on temperature conditions.

---

### Level 0 DFD (Context Diagram)

The Level 0 DFD represents the overall interaction between the user and the Temperature Monitoring and Alert System.

![Level 0 Data Flow Diagram](assets/images/dfd.png){width=5in height=3.5in}

The Level 0 DFD shows that the user interacts with the system through temperature monitoring and receives alert notifications whenever abnormal temperature conditions occur.

---

### Level 1 DFD

The Level 1 DFD explains the internal processing steps of the proposed system.

![Level 1 Data Flow Diagram](assets/images/dfd.png){width=5in height=3.5in}

The Level 1 DFD shows that the DHT22 sensor sends temperature data to the ESP32 controller. The ESP32 processes the data, compares it with the threshold value, displays the readings on the Serial Monitor, and activates the buzzer whenever the temperature exceeds the safe limit.

---

## Flow Chart

The flow chart represents the complete operational sequence of the Temperature Monitoring and Alert System using ESP32.

![Flow Chart of Proposed System](assets/images/dfd.png){width=5in height=3.5in}

The flow chart begins with system initialization. The DHT22 sensor continuously monitors the environmental temperature and sends the readings to the ESP32 controller. The ESP32 compares the temperature value with the predefined threshold condition. If the temperature exceeds the threshold value, the buzzer is activated automatically; otherwise, the buzzer remains OFF. The temperature readings are displayed continuously on the Serial Monitor, and the process repeats continuously for real-time monitoring.

\newpage
