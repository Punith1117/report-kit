# 5. IMPLEMENTATION

The Implementation chapter explains the practical development and execution of the proposed Temperature Monitoring and Alert System using ESP32. This chapter describes the hardware setup, software configuration, sensor interfacing, and program implementation used for developing the system. The implementation process involves connecting the DHT22 temperature sensor and buzzer to the ESP32 microcontroller and programming the controller using Arduino IDE.

The DHT22 sensor is used to continuously measure the surrounding temperature and send the sensor readings to the ESP32 controller. The ESP32 processes the received temperature data and compares it with the predefined threshold value programmed into the system. Whenever the temperature exceeds the threshold value, the ESP32 automatically activates the buzzer to alert the user. The temperature readings are also displayed continuously on the Serial Monitor for monitoring and analysis.

The project is implemented using simple hardware components and embedded programming concepts. Proper wiring connections are established between the ESP32, DHT22 sensor, and buzzer using jumper wires and breadboard. The system is powered through a USB data cable connected to the computer.

---

## 5.1 Hardware Implementation

The hardware implementation involves interfacing the DHT22 sensor and buzzer with the ESP32 microcontroller. The DHT22 sensor acts as the input device and continuously senses environmental temperature. The ESP32 microcontroller acts as the processing unit and controls the overall operation of the system. The buzzer acts as the output device and generates an alert sound whenever the temperature exceeds the threshold value.

### Hardware Connections

----------------- ----------------------
 Component         ESP32 Pin Connection
----------------- ----------------------
 DHT22 VCC         3.3V
 
 DHT22 DATA        GPIO4
 
 DHT22 GND         GND
 
 Buzzer Positive   GPIO18
 
 Buzzer Negative   GND
----------------- ----------------------

Table 5.1: Hardware Connections

The DHT22 sensor sends temperature readings to the ESP32 through GPIO4 pin. The ESP32 processes the temperature values and activates the buzzer connected to GPIO18 whenever the threshold condition is satisfied.

---

## 5.2 Software Configuration

The software implementation of the project is carried out using Arduino IDE. The ESP32 board package and DHT sensor library are installed in the Arduino IDE to support programming and communication with the sensor.

The following software configuration steps are performed during implementation:

- Installation of Arduino IDE
- Installation of ESP32 Board Package
- Installation of DHT Sensor Library
- Selection of ESP32 Board and COM Port
- Writing and uploading Embedded C program
- Serial Monitor configuration for temperature display

The Arduino IDE is used to write, compile, and upload the program code to the ESP32 microcontroller through the USB data cable.

---

## 5.3 Program Code

The program code is written using Embedded C language in Arduino IDE. The program continuously reads temperature values from the DHT22 sensor and compares them with the predefined threshold value. If the temperature exceeds the threshold limit, the buzzer is activated automatically.

---

### Algorithm

1. Start the system
2. Initialize ESP32 and DHT22 sensor
3. Read temperature value from DHT22 sensor
4. Compare temperature with threshold value
5. If temperature exceeds threshold, activate buzzer
6. Otherwise keep buzzer OFF
7. Display temperature on Serial Monitor
8. Repeat the process continuously

---

### Program Code

```text
#include "DHT.h"
#define DHTPIN 4
#define DHTTYPE DHT22
#define BUZZER_PIN 18

DHT dht(DHTPIN, DHTTYPE);

float threshold = 35.0;

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  Serial.println("Temperature Monitoring Started");
}

void loop() {

  float temperature = dht.readTemperature();

  if (isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" °C");

  if (temperature > threshold) {
    digitalWrite(BUZZER_PIN, HIGH);
    Serial.println("ALERT! HIGH TEMPERATURE!");
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }
  
  delay(2000);
}
```

\newpage
