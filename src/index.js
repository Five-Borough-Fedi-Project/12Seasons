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
        body::before,
        body::after { 
          content: ""; 
          position: fixed; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 100%; 
          pointer-events: none; 
          z-index: 9999;
        }
        body::before {
          background-image: 
            radial-gradient(ellipse 2px 6px at 10% 20%, rgba(180,200,220,0.4) 0%, transparent 100%),
            radial-gradient(ellipse 2px 5px at 25% 60%, rgba(180,200,220,0.35) 0%, transparent 100%),
            radial-gradient(ellipse 1.5px 5px at 40% 10%, rgba(180,200,220,0.3) 0%, transparent 100%),
            radial-gradient(ellipse 2px 6px at 55% 45%, rgba(180,200,220,0.4) 0%, transparent 100%),
            radial-gradient(ellipse 1.5px 4px at 70% 75%, rgba(180,200,220,0.35) 0%, transparent 100%),
            radial-gradient(ellipse 2px 5px at 85% 30%, rgba(180,200,220,0.3) 0%, transparent 100%),
            radial-gradient(ellipse 1.5px 5px at 95% 55%, rgba(180,200,220,0.4) 0%, transparent 100%);
          background-size: 100% 120px;
          animation: rain-drop 1.2s linear infinite;
        }
        body::after {
          background-image: 
            radial-gradient(ellipse 1.5px 5px at 5% 40%, rgba(180,200,220,0.35) 0%, transparent 100%),
            radial-gradient(ellipse 2px 6px at 18% 80%, rgba(180,200,220,0.3) 0%, transparent 100%),
            radial-gradient(ellipse 2px 5px at 32% 25%, rgba(180,200,220,0.4) 0%, transparent 100%),
            radial-gradient(ellipse 1.5px 4px at 48% 65%, rgba(180,200,220,0.35) 0%, transparent 100%),
            radial-gradient(ellipse 2px 6px at 62% 15%, rgba(180,200,220,0.3) 0%, transparent 100%),
            radial-gradient(ellipse 1.5px 5px at 78% 50%, rgba(180,200,220,0.4) 0%, transparent 100%),
            radial-gradient(ellipse 2px 5px at 90% 85%, rgba(180,200,220,0.35) 0%, transparent 100%);
          background-size: 100% 150px;
          animation: rain-drop 1.8s linear infinite;
          animation-delay: 0.4s;
        }
        @keyframes rain-drop { 
          from { background-position: 0 -120px; } 
          to { background-position: 0 100vh; } 
        }
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
        @keyframes wisp-drift {
          0% { transform: translateX(100vw) translateY(0) rotate(0deg); opacity: 0; }
          5% { opacity: 0.4; }
          50% { transform: translateX(-20vw) translateY(30px) rotate(15deg); opacity: 0.3; }
          95% { opacity: 0; }
          100% { transform: translateX(-120vw) translateY(-20px) rotate(-10deg); opacity: 0; }
        }
        @keyframes wisp-drift-2 {
          0% { transform: translateX(100vw) translateY(0) rotate(5deg); opacity: 0; }
          10% { opacity: 0.3; }
          50% { transform: translateX(-10vw) translateY(-40px) rotate(-20deg); opacity: 0.25; }
          90% { opacity: 0; }
          100% { transform: translateX(-130vw) translateY(10px) rotate(5deg); opacity: 0; }
        }
        body::before {
          content: "";
          position: fixed;
          top: 30%;
          left: 0;
          width: 300px;
          height: 60px;
          pointer-events: none;
          z-index: 9999;
          background: radial-gradient(ellipse 150px 8px at center, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 40%, transparent 70%),
                      radial-gradient(ellipse 100px 5px at 60% 70%, rgba(255,255,255,0.3) 0%, transparent 60%),
                      radial-gradient(ellipse 80px 4px at 30% 40%, rgba(255,255,255,0.25) 0%, transparent 50%);
          filter: blur(2px);
          animation: wisp-drift 4s ease-in-out infinite;
        }
        body::after {
          content: "";
          position: fixed;
          top: 60%;
          left: 0;
          width: 250px;
          height: 50px;
          pointer-events: none;
          z-index: 9999;
          background: radial-gradient(ellipse 120px 6px at center, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 50%, transparent 70%),
                      radial-gradient(ellipse 70px 4px at 70% 60%, rgba(255,255,255,0.2) 0%, transparent 55%);
          filter: blur(3px);
          animation: wisp-drift-2 6s ease-in-out infinite;
          animation-delay: 2s;
        }
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