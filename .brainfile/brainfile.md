---
schema: https://brainfile.md/v2/board.json
title: SmartPoi ESP32 LED Controller
agent:
  instructions:
    - Task files are individual .md files in board/
    - Completed tasks are in logs/
    - Preserve all IDs
    - Make minimal changes
columns:
  - id: todo
    title: To Do
  - id: in-progress
    title: In Progress
---

# SmartPoi Controls - Brainfile

## Project Information
- **Repository Type**: Mobile App (Cordova)
- **Primary Technology Stack**: Cordova, JavaScript, HTML/CSS
- **Key Dependencies**: Cordova plugins, jQuery, Bootstrap
- **Build/Test Commands**: cordova build android, cordova run android

## Project Rules

### always
1. Maintain backward compatibility with existing POI hardware
2. Preserve existing tab navigation and user interface patterns
3. Use existing state management system (state.js)
4. Follow existing error handling patterns with createMessage()
5. Test all changes on actual POI hardware when possible

### never
1. Break existing upload or image processing functionality
2. Modify core POI communication protocols
3. Remove or alter existing tab functionality
4. Introduce breaking changes to the user interface
5. Bypass existing validation and security checks

### prefer
1. Reuse existing utility functions and patterns
2. Modular, testable code with clear separation of concerns
3. Consistent styling with existing application
4. Progressive enhancement over complete rewrites
5. Clear user feedback during operations

### context
1. POI devices have limited storage and processing capabilities
2. Users may have slow or unreliable network connections
3. Application must work offline for basic functionality
4. Support both WS2812 and APA102 LED strip types
5. Maintain compatibility with existing .bin file format

## Task Board

### todo
<!-- Tasks will be added here -->

### in_progress
<!-- Tasks will be added here -->

### done
<!-- Tasks will be added here -->

### archive
<!-- Archived tasks will be moved here -->

