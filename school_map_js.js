/* 
=====================================
School Map Website - JavaScript
For Grade 7 Students Learning Web Development
=====================================
*/

// Global variables - these store data that the whole website can use
let allLocations = []; // Array to store all our school locations
let currentMapType = 'google'; // Tracks whether we're showing Google Maps or custom map

// Replace this with your actual Google Apps Script URL
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

// Sample data for testing (remove this when you connect to Google Sheets)
const sampleLocations = [
    {
        name: "Room 101",
        description: "Grade 7 Mathematics classroom with interactive whiteboard",
        type: "classroom",
        lat: 37.7749,
        lng: -122.4194,
        x: 150,
        y: 145
    },
    {
        name: "Library",
        description: "Quiet study space with computers and thousands of books",
        type: "facility",
        lat: 37.7750,
        lng: -122.4195,
        x: 475,
        y: 145
    },
    {
        name: "Cafeteria",
        description: "Lunch room with healthy meal options",
        type: "facility",
        lat: 37.7748,
        lng: -122.4193,
        x: 650,
        y: 145
    },
    {
        name: "Main Office",
        description: "Principal's office and administration",
        type: "office",
        lat: 37.7751,
        lng: -122.4196,
        x: 450,
        y: 295
    },
    {
        name: "Gym",
        description: "Physical education and sports activities",
        type: "facility",
        lat: 37.7747,
        lng: -122.4192,
        x: 200,
        y: 295
    },
    {
        name: "Playground",
        description: "Outdoor play area with swings and slides",
        type: "outdoor",
        lat: 37.7746,
        lng: -122.4191,
        x: 650,
        y: 290
    }
];

// This function runs when the page finishes loading
window.addEventListener('load', function() {
    console.log('🎉 School Map website is loading!'); // Debug message
    
    // Try to load real data from Google Sheets
    loadLocationsFromServer();
    
    // Set up click handlers for the custom map
    setupCustomMapClicks();
    
    // Hide the loading message after a delay
    setTimeout(function() {
        document.getElementById('loadingMessage').style.display = 'none';
    }, 2000);
});

// Function to load location data from our Google Apps Script
async function loadLocationsFromServer() {
    try {
        console.log('📡 Trying to load data from Google Sheets...');
        
        // Try to fetch data from your Google Apps Script
        const response = await fetch(GOOGLE_SCRIPT_URL);
        
        if (response.ok) {
            const data = await response.json();
            allLocations = data;
            console.log('✅ Successfully loaded', allLocations.length, 'locations from Google Sheets');
        } else {
            throw new Error('Server response not OK');
        }
        
    } catch (error) {
        console.log('⚠️ Could not load from Google Sheets, using sample data instead');
        console.log('Error details:', error.message);
        
        // Use sample data if Google Sheets isn't working yet
        allLocations = sampleLocations;
    }
    
    // Update the maps with our location data
    updateMaps();
}

// Function to update both Google Maps and custom map with location markers
function updateMaps() {
    console.log('🗺️ Updating maps with', allLocations.length, 'locations');
    
    // Update Google Maps markers
    updateGoogleMapsMarkers();
    
    // Update custom map markers
    updateCustomMapMarkers();
}

// Function to add markers to Google Maps
function updateGoogleMapsMarkers() {
    // Note: This is a simplified version. In a real app, you'd use the Google Maps JavaScript API
    // For now, we'll just update the iframe src with the first location
    if (allLocations.length > 0) {
        const firstLocation = allLocations[0];
        if (firstLocation.lat && firstLocation.lng) {
            const mapIframe = document.getElementById('googleMap');
            const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.4037580!2d${firstLocation.lng}!3d${firstLocation.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${firstLocation.lat}N%20${Math.abs(firstLocation.lng)}W!5e0!3m2!1sen!2sus!4v1234567890`;
            mapIframe.src = mapUrl;
        }
    }
}

// Function to add clickable markers to the custom map
function updateCustomMapMarkers() {
    const markersContainer = document.getElementById('mapMarkers');
    if (!markersContainer) return;
    
    // Clear existing markers
    markersContainer.innerHTML = '';
    
    // Add a marker for each location that has x,y coordinates
    allLocations.forEach(function(location, index) {
        if (location.x && location.y) {
            // Create a marker element
            const marker = document.createElement('div');
            marker.className = 'map-marker';
            marker.id = 'marker-' + index;
            
            // Position the marker using the x,y coordinates
            marker.style.left = location.x + 'px';
            marker.style.top = location.y + 'px';
            
            // Add click handler to show location info
            marker.addEventListener('click', function() {
                showLocationInfo(location);
            });
            
            // Add hover tooltip
            marker.title = location.name;
            
            // Add the marker to the map
            markersContainer.appendChild(marker);
            
            console.log('📍 Added marker for', location.name, 'at', location.x, location.y);
        }
    });
}

// Function to set up click events on the SVG map areas
function setupCustomMapClicks() {
    // Wait a bit for the image to load
    setTimeout(function() {
        const clickableElements = document.querySelectorAll('.clickable');
        clickableElements.forEach(function(element) {
            element.addEventListener('click', function() {
                const locationName = element.getAttribute('data-name');
                const location = allLocations.find(loc => loc.name === locationName);
                if (location) {
                    showLocationInfo(location);
                }
            });
        });
    }, 1000);
}

// Function to search for a location
function searchLocation() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    console.log('🔍 Searching for:', searchTerm);
    
    if (searchTerm === '') {
        alert('Please enter a location name to search!');
        return;
    }
    
    // Find matching locations
    const matchingLocation = allLocations.find(function(location) {
        return location.name.toLowerCase().includes(searchTerm);
    });
    
    if (matchingLocation) {
        console.log('✅ Found location:', matchingLocation.name);
        
        // Show the location info
        showLocationInfo(matchingLocation);
        
        // Highlight the location on the map
        highlightLocation(matchingLocation);
        
        // Show success message
        showMessage('Found: ' + matchingLocation.name, 'success');
        
    } else {
        console.log('❌ No location found for:', searchTerm);
        showMessage('Location not found. Try searching for: ' + 
                   allLocations.map(loc => loc.name).slice(0, 3).join(', '), 'error');
    }
}

// Function to highlight a location on the map
function highlightLocation(location) {
    // Remove existing highlights
    const existingHighlights = document.querySelectorAll('.highlighted');
    existingHighlights.forEach(function(element) {
        element.classList.remove('highlighted');
    });
    
    // Find and highlight the marker for this location
    const locationIndex = allLocations.indexOf(location);
    const marker = document.getElementById('marker-' + locationIndex);
    if (marker) {
        marker.classList.add('highlighted');
        console.log('🎯 Highlighted marker for', location.name);
    }
}

// Function to clear the search
function clearSearch() {
    document.getElementById('searchInput').value = '';
    
    // Remove highlights
    const highlights = document.querySelectorAll('.highlighted');
    highlights.forEach(function(element) {
        element.classList.remove('highlighted');
    });
    
    // Close location info if open
    closeLocationInfo();
    
    console.log('🧹 Search cleared');
}

// Function to show information about a location
function showLocationInfo(location) {
    const infoDiv = document.getElementById('locationInfo');
    const nameElement = document.getElementById('locationName');
    const descriptionElement = document.getElementById('locationDescription');
    
    // Update the content
    nameElement.textContent = location.name;
    descriptionElement.textContent = location.description || 'No description available.';
    
    // Show the info box
    infoDiv.style.display = 'block';
    
    // Scroll to the info box so user can see it
    infoDiv.scrollIntoView({ behavior: 'smooth' });
    
    console.log('ℹ️ Showing info for:', location.name);
}

// Function to close the location information display
function closeLocationInfo() {
    document.getElementById('locationInfo').style.display = 'none';
    console.log('❌ Closed location info');
}

// Function to switch to Google Maps view
function showGoogleMaps() {
    document.getElementById('googleMapContainer').style.display = 'block';
    document.getElementById('customMapContainer').style.display = 'none';
    
    // Update button states
    document.getElementById('googleBtn').classList.add('active');
    document.getElementById('customBtn').classList.remove('active');
    
    currentMapType = 'google';
    console.log('🌐 Switched to Google Maps view');
}

// Function to switch to custom map view
function showCustomMap() {
    document.getElementById('googleMapContainer').style.display = 'none';
    document.getElementById('customMapContainer').style.display = 'block';
    
    // Update button states
    document.getElementById('googleBtn').classList.remove('active');
    document.getElementById('customBtn').classList.add('active');
    
    currentMapType = 'custom';
    console.log('🗺️ Switched to custom map view');
}

// Function to show messages to the user
function showMessage(message, type) {
    // Create a message element
    const messageDiv = document.createElement('div');
    messageDiv.className = type; // 'success' or 'error'
    messageDiv.textContent = message;
    
    // Add it to the page
    const searchContainer = document.querySelector('.search-container');
    searchContainer.appendChild(messageDiv);
    
    // Remove the message after 5 seconds
    setTimeout(function() {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

// Function to handle the Enter key in search box
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                searchLocation();
            }
        });
    }
});

// Function to save a new location (called from admin page)
async function saveLocation(locationData) {
    try {
        console.log('💾 Saving new location:', locationData.name);
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(locationData)
        });
        
        if (response.ok) {
            console.log('✅ Location saved successfully');
            // Reload the locations to get the updated list
            await loadLocationsFromServer();
            return true;
        } else {
            throw new Error('Failed to save location');
        }
        
    } catch (error) {
        console.error('❌ Error saving location:', error);
        return false;
    }
}

// Debug function to help students understand what's happening
function debugInfo() {
    console.log('🐛 DEBUG INFO:');
    console.log('Total locations:', allLocations.length);
    console.log('Current map type:', currentMapType);
    console.log('Google Apps Script URL:', GOOGLE_SCRIPT_URL);
    console.log('All locations:', allLocations);
}

// Make debug function available in browser console
window.debugInfo = debugInfo;

// Welcome message for students
console.log('🎓 Welcome to the School Map Website!');
console.log('💡 This website was built for Grade 7 students to learn web development.');
console.log('🔧 Type debugInfo() in the console to see technical details.');
console.log('📚 Check the help.html page for setup instructions!');