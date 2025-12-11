// ============================================================
// 🚀 NAVIGATION ENHANCEMENTS v2.0
// Features:
// 1. บอกขึ้นบันได/ลิฟต์ตามชั้น
// 2. บอกเลี้ยวซ้าย/ขวา/เดินตรงไป ตามเส้นทางจริง
// ============================================================

/**
 * ดึงพิกัดจาก SVG path
 */
function extractPathPoints() {
    const pathElement = document.querySelector('#routePath path.route-line');
    if (!pathElement) return [];
    
    const d = pathElement.getAttribute('d');
    if (!d) return [];
    
    const points = [];
    const regex = /([ML])\s*([\d.]+)\s+([\d.]+)/g;
    let match;
    
    while ((match = regex.exec(d)) !== null) {
        points.push({
            x: parseFloat(match[2]),
            y: parseFloat(match[3])
        });
    }
    
    return points;
}

/**
 * คำนวณระยะทางระหว่างสองจุด (เมตร)
 */
function calculateSegmentDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.round(Math.sqrt(dx * dx + dy * dy) * 2); // scale factor
}

/**
 * คำนวณทิศทางเริ่มต้น
 */
function getInitialDirection(p1, p2, lang) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    
    if (lang === 'th') {
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'ไปทางขวา' : 'ไปทางซ้าย';
        } else {
            return dy > 0 ? 'ลงด้านล่าง' : 'ขึ้นด้านบน';
        }
    } else {
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'to the right' : 'to the left';
        } else {
            return dy > 0 ? 'downward' : 'upward';
        }
    }
}

/**
 * วิเคราะห์การเลี้ยวที่แต่ละจุด
 */
function analyzeTurns(points) {
    const turns = [];
    
    for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        
        // คำนวณ angle
        const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x) * 180 / Math.PI;
        const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x) * 180 / Math.PI;
        let turnAngle = angle2 - angle1;
        
        // Normalize to -180 to 180
        if (turnAngle > 180) turnAngle -= 360;
        if (turnAngle < -180) turnAngle += 360;
        
        // กำหนด threshold สำหรับการเลี้ยว
        let turnType = 'straight';
        if (turnAngle > 25) turnType = 'right';
        else if (turnAngle < -25) turnType = 'left';
        
        // คำนวณระยะทางจากจุดก่อนหน้า
        const distance = calculateSegmentDistance(prev, curr);
        
        turns.push({
            pointIndex: i,
            point: curr,
            turnAngle: turnAngle,
            turnType: turnType,
            distanceFromPrev: distance
        });
    }
    
    return turns;
}

/**
 * สร้างขั้นตอนการนำทางจากข้อมูลเส้นทาง
 */
function generateDetailedNavigationSteps(room, lang) {
    const points = extractPathPoints();
    if (points.length < 2) return null;
    
    const turns = analyzeTurns(points);
    const steps = [];
    let stepNum = 1;
    
    // Step 1: เริ่มต้น
    steps.push({
        step: stepNum++,
        text: lang === 'th' ? 'เริ่มต้นจากจุดเริ่มต้น' : 'Start from starting point',
        distance: '0m',
        icon: 'fa-location-dot',
        type: 'start'
    });
    
    // Step 2: ทิศทางเริ่มต้น
    const initialDir = getInitialDirection(points[0], points[1], lang);
    const firstDistance = calculateSegmentDistance(points[0], points[1]);
    steps.push({
        step: stepNum++,
        text: lang === 'th' 
            ? `เดิน${initialDir} ประมาณ ${firstDistance} เมตร` 
            : `Walk ${initialDir} approximately ${firstDistance} meters`,
        distance: `${firstDistance}m`,
        icon: 'fa-person-walking',
        type: 'walk'
    });
    
    // สร้าง steps สำหรับการเลี้ยว
    let accumulatedDistance = 0;
    
    for (let i = 0; i < turns.length; i++) {
        const turn = turns[i];
        accumulatedDistance += turn.distanceFromPrev;
        
        if (turn.turnType !== 'straight') {
            // มีการเลี้ยว
            let turnText = '';
            let turnIcon = '';
            
            if (turn.turnType === 'left') {
                turnText = lang === 'th' ? 'เลี้ยวซ้าย' : 'Turn left';
                turnIcon = 'fa-arrow-left';
            } else {
                turnText = lang === 'th' ? 'เลี้ยวขวา' : 'Turn right';
                turnIcon = 'fa-arrow-right';
            }
            
            steps.push({
                step: stepNum++,
                text: turnText,
                distance: `${accumulatedDistance}m`,
                icon: turnIcon,
                type: 'turn',
                turnType: turn.turnType
            });
            
            // หลังเลี้ยวให้เพิ่ม step เดินตรงไป (ถ้ามีระยะทางหลังจากเลี้ยว)
            const nextTurnIndex = turns.findIndex((t, idx) => idx > i && t.turnType !== 'straight');
            let walkDistance = 0;
            
            if (nextTurnIndex === -1) {
                // ไม่มีการเลี้ยวอีก - คำนวณระยะทางที่เหลือ
                for (let j = i + 1; j < turns.length; j++) {
                    walkDistance += turns[j].distanceFromPrev;
                }
                // เพิ่มระยะทางจากจุดสุดท้ายของ turns ไปยังจุดหมาย
                if (points.length > 1) {
                    walkDistance += calculateSegmentDistance(points[points.length - 2], points[points.length - 1]);
                }
            } else {
                // มีการเลี้ยวอีก - คำนวณระยะทางถึงจุดเลี้ยวถัดไป
                for (let j = i + 1; j < nextTurnIndex; j++) {
                    walkDistance += turns[j].distanceFromPrev;
                }
            }
            
            if (walkDistance > 5) {
                steps.push({
                    step: stepNum++,
                    text: lang === 'th' 
                        ? `เดินตรงไป ${walkDistance} เมตร` 
                        : `Walk straight ${walkDistance} meters`,
                    distance: `${walkDistance}m`,
                    icon: 'fa-arrow-up',
                    type: 'walk'
                });
            }
            
            accumulatedDistance = 0;
        }
    }
    
    // Step: มองหาอาคาร
    steps.push({
        step: stepNum++,
        text: lang === 'th' 
            ? `มองหา ${getBuildingName(room.building)}` 
            : `Look for ${getBuildingName(room.building)}`,
        distance: '10m',
        icon: 'fa-building',
        type: 'building'
    });
    
    // Step: บอกชั้น
    const startFloor = (typeof startPoint !== 'undefined' && startPoint) 
        ? (startPoint.floor || startPoint.defaultFloor || 1) 
        : 1;
    const destFloor = room.floor || 1;
    const floorDiff = destFloor - startFloor;
    const needsFloorChange = floorDiff !== 0;
    const floorsToTravel = Math.abs(floorDiff);
    
    let floorText = '';
    if (needsFloorChange) {
        if (lang === 'th') {
            if (floorDiff > 0) {
                floorText = floorsToTravel > 2 
                    ? `ขึ้นลิฟต์หรือบันไดไปชั้น ${destFloor} (${floorsToTravel} ชั้น)`
                    : `ขึ้นบันไดไปชั้น ${destFloor}`;
            } else {
                floorText = floorsToTravel > 2 
                    ? `ลงลิฟต์หรือบันไดไปชั้น ${destFloor} (${floorsToTravel} ชั้น)`
                    : `ลงบันไดไปชั้น ${destFloor}`;
            }
        } else {
            if (floorDiff > 0) {
                floorText = floorsToTravel > 2 
                    ? `Take elevator or stairs to floor ${destFloor} (${floorsToTravel} floors up)`
                    : `Go up stairs to floor ${destFloor}`;
            } else {
                floorText = floorsToTravel > 2 
                    ? `Take elevator or stairs to floor ${destFloor} (${floorsToTravel} floors down)`
                    : `Go down stairs to floor ${destFloor}`;
            }
        }
    } else {
        floorText = lang === 'th' 
            ? `ห้องอยู่ชั้น ${destFloor}` 
            : `Room is on floor ${destFloor}`;
    }
    
    steps.push({
        step: stepNum++,
        text: floorText,
        distance: needsFloorChange ? `${floorsToTravel} ${lang === 'th' ? 'ชั้น' : 'floor(s)'}` : '0m',
        icon: needsFloorChange ? 'fa-stairs' : 'fa-check',
        type: 'floor',
        needsFloorChange: needsFloorChange
    });
    
    // Step: เข้าสู่ห้อง
    steps.push({
        step: stepNum++,
        text: lang === 'th' ? `เข้าสู่ ${room.name}` : `Enter ${room.name}`,
        distance: '0m',
        icon: 'fa-door-open',
        type: 'enter'
    });
    
    return steps;
}

/**
 * 🔧 Override generateOverlayNavigationSteps
 */
function generateOverlayNavigationSteps_Enhanced(room) {
    const routeSteps = document.getElementById('overlayRouteSteps');
    if (!routeSteps) return;
    
    if (!startPoint) {
        const noStartText = currentLanguage === 'th' 
            ? 'คลิกที่แผนที่เพื่อตั้งจุดเริ่มต้นก่อน'
            : 'Click on map to set starting point first';
            
        routeSteps.innerHTML = `
            <div style="text-align: center; padding: 20px; background: #fff3cd; border-radius: var(--border-radius); color: #856404;">
                <i class="fas fa-exclamation-triangle"></i>
                <p style="margin: 8px 0 0 0; font-size: 14px;">${noStartText}</p>
            </div>
        `;
        return;
    }
    
    // ใช้ระบบใหม่ที่วิเคราะห์การเลี้ยว
    const steps = generateDetailedNavigationSteps(room, currentLanguage);
    
    if (!steps || steps.length === 0) {
        // Fallback to original if path not available
        if (typeof generateOverlayNavigationSteps_Original === 'function') {
            generateOverlayNavigationSteps_Original(room);
        }
        return;
    }
    
    const stepsTitle = currentLanguage === 'th' ? 'ขั้นตอนการเดินทาง' : 'Navigation Steps';
    
    routeSteps.innerHTML = `
        <div class="route-steps">
            <h4 style="margin: 0 0 15px 0; font-size: 16px; color: var(--primary-color);">
                <i class="fas fa-route"></i> ${stepsTitle}
            </h4>
            ${steps.map(step => `
                <div class="route-step ${step.type === 'turn' ? 'turn-step' : ''} ${step.type === 'floor' && step.needsFloorChange ? 'floor-change-step' : ''}">
                    <div class="step-number">${step.step}</div>
                    <div class="step-content">
                        <i class="fas ${step.icon}" style="margin-right: 8px; color: ${getStepIconColor(step.type, step.turnType)};"></i>
                        ${step.text}
                    </div>
                    <div class="step-distance">${step.distance}</div>
                    <button class="step-voice-btn" onclick="speakStep('${step.text.replace(/'/g, "\\'")}')">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * กำหนดสีไอคอนตาม step type
 */
function getStepIconColor(type, turnType) {
    switch (type) {
        case 'start': return '#4CAF50';
        case 'walk': return '#2196F3';
        case 'turn': return turnType === 'left' ? '#FF9800' : '#FF5722';
        case 'building': return '#9C27B0';
        case 'floor': return '#FFC107';
        case 'enter': return '#4CAF50';
        default: return '#666';
    }
}

/**
 * 🔧 Override generateVoiceQueue สำหรับเสียงนำทาง
 */
function generateVoiceQueue_Enhanced() {
    voiceQueue = [];
    
    if (!currentRoute) return;
    
    const { destination } = currentRoute;
    const steps = generateDetailedNavigationSteps(destination, currentLanguage);
    
    if (!steps || steps.length === 0) {
        // Fallback
        if (typeof generateVoiceQueue_Original === 'function') {
            generateVoiceQueue_Original();
        }
        return;
    }
    
    // แปลง steps เป็น voice queue
    steps.forEach(step => {
        voiceQueue.push(step.text);
    });
    
    // เพิ่มข้อความจบ
    voiceQueue.push(currentLanguage === 'th' 
        ? 'ถึงจุดหมายแล้ว การนำทางเสร็จสิ้น' 
        : 'Destination reached. Navigation complete');
}

/**
 * Inject CSS สำหรับ turn steps
 */
function injectTurnStepStyles() {
    if (document.getElementById('turn-step-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'turn-step-styles';
    style.textContent = `
        .route-step.turn-step {
            background: linear-gradient(135deg, #fff8e1, #ffecb3) !important;
            border-left: 4px solid #FF9800 !important;
        }
        .route-step.floor-change-step {
            background: linear-gradient(135deg, #e3f2fd, #bbdefb) !important;
            border-left: 4px solid #2196F3 !important;
        }
        .route-step .step-content i {
            width: 20px;
            text-align: center;
        }
    `;
    document.head.appendChild(style);
}

// ============================================================
// 🚀 INITIALIZATION
// ============================================================

function initNavigationEnhancements() {
    console.log('🚀 Initializing Navigation Enhancements v2.0...');
    
    // Inject styles
    injectTurnStepStyles();
    
    // Override generateOverlayNavigationSteps
    if (typeof generateOverlayNavigationSteps !== 'undefined') {
        window.generateOverlayNavigationSteps_Original = generateOverlayNavigationSteps;
        window.generateOverlayNavigationSteps = generateOverlayNavigationSteps_Enhanced;
        console.log('✅ generateOverlayNavigationSteps enhanced with turn detection');
    } else {
        console.warn('⚠️ generateOverlayNavigationSteps not found - will retry');
        setTimeout(initNavigationEnhancements, 1000);
        return;
    }
    
    // Override generateVoiceQueue
    if (typeof generateVoiceQueue !== 'undefined') {
        window.generateVoiceQueue_Original = generateVoiceQueue;
        window.generateVoiceQueue = generateVoiceQueue_Enhanced;
        console.log('✅ generateVoiceQueue enhanced with turn detection');
    }
    
    console.log('✅ Navigation Enhancements v2.0 initialized');
    console.log('   Features: Floor navigation + Turn-by-turn directions');
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigationEnhancements);
} else {
    initNavigationEnhancements();
}

console.log('🚀 Navigation Enhancements v2.0 loaded');