export default {
  async fetch(request, env, ctx) {
    // 1. Fetch Weather from the specific Open-Meteo URL provided
    // This requests: Rain, Showers, Snowfall, Wind Gusts, and Wind Direction
    const weatherUrl = "https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.006&current=rain,showers,snowfall,wind_gusts_10m,wind_direction_10m";
    
    let css = "/* Weather: Clear */"; // Default state
    
    try {
      const response = await fetch(weatherUrl);
      const data = await response.json();
      
      // Extract the specific 'current' data points
      const current = data.current;
      const rainAmount = (current.rain || 0) + (current.showers || 0); // Combine rain + showers
      const snowAmount = current.snowfall || 0;
      const windGusts = current.wind_gusts_10m || 0;
      
      // Threshold definitions
      const isRaining = rainAmount > 0.1; // More than 0.1mm is visible rain
      const isSnowing = snowAmount > 0.0; // Any snow is visible
      const isWindy = windGusts > 45;     // > 45 km/h gusts (approx 28mph) counts as "really windy"

      // --- CSS TEMPLATES ---
      const cssRain = `
        /* WEATHER: RAIN */
        body::after { 
          content: ""; position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
          pointer-events: none; z-index: 9999; 
          background-image: linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 100%); 
          background-size: 2px 30px; 
          animation: rain-fall 0.3s linear infinite; 
          opacity: 0.3; 
        }
        @keyframes rain-fall { from { background-position: 0 0; } to { background-position: 0 100vh; } }
      `;

      const cssSnow = `
        /* WEATHER: SNOW */
        body::after { 
          content: ""; position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
          pointer-events: none; z-index: 9999; 
          background-image: radial-gradient(4px 4px at 100px 50px, #fff, transparent), 
                            radial-gradient(6px 6px at 200px 150px, #fff, transparent), 
                            radial-gradient(3px 3px at 300px 250px, #fff, transparent); 
          background-size: 550px 550px; 
          animation: snow-fall 10s linear infinite; 
          opacity: 0.8; 
        }
        @keyframes snow-fall { from { background-position: 0 0; } to { background-position: 0 550px; } }
      `;

      const cssWind = `
        /* WEATHER: WIND */
        body { animation: wind-shake 0.5s infinite; }
        body::after { 
          content: ""; position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
          pointer-events: none; z-index: 9999; 
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%); 
          background-size: 200% 100%; 
          animation: wind-blow 1s linear infinite; 
        }
        @keyframes wind-shake { 
          0%, 100% { transform: translateX(0); } 
          25% { transform: translateX(1px); } 
          75% { transform: translateX(-1px); } 
        }
        @keyframes wind-blow { from { background-position: 200% 0; } to { background-position: -200% 0; } }
      `;

      // --- LOGIC PRIORITY ---
      // 1. Snow takes priority (visually most distinct)
      if (isSnowing) {
        css = cssSnow;
      } 
      // 2. Rain is next
      else if (isRaining) {
        css = cssRain;
      } 
      // 3. If it's dry but windy, show wind
      else if (isWindy) {
        css = cssWind;
      }

    } catch (e) {
      // If API fails, return a comment so the site doesn't break
      css = `/* Error fetching weather: ${e.message} */`;
    }

    return new Response(css, {
      headers: {
        "content-type": "text/css; charset=utf-8",
        "access-control-allow-origin": "*", 
        "cache-control": "public, max-age=900" // Cache for 15 mins
      },
    });
  },
};