// -----JS CODE-----
//@input Component.ScriptComponent mlOutputDecoderScript
//@input Component.ScriptComponent onPointerEventScript
//@input SceneObject pointerObjectTrackingHint = null
//@input SceneObject goodAnimation = null
//@input SceneObject badAnimation1 = null
//@input SceneObject badAnimation2 = null

const DisableDetectionStates = false

const CupClass = 1
const CatClass = 3
const DogClass = 5
const BottleClass = 7

const PointEndEventDelay = 5
const ObjectDetectionEndEventDelay = 5

var pointEndEventDelayRemaining = 0
var isPointing = false

var objectDetectEndEventDelayRemaining = 0
var objectWasDetected = false
var isObjectDetectionOn = false
var detectedObjectClass = -1


function resetReinforcements() {
    if (script.goodAnimation) script.goodAnimation.enabled = false
    if (script.badAnimation1) script.badAnimation1.enabled = false
    if (script.badAnimation2) script.badAnimation2.enabled = false
}

function doPositiveReinforcement() {
    if (script.goodAnimation) {
        if (objectWasDetected && detectedObjectClass === BottleClass) {
            script.goodAnimation.enabled = true
        }
    }
    else {
        print("script.goodAnimation undefined")
    }
}

function doNegativeReinforcement() {
    if (script.badAnimation1) script.badAnimation1.enabled = true
    else print("script.badAnimation1 undefined")
    
    if (script.badAnimation2) script.badAnimation2.enabled = true
    else print("script.badAnimation2 undefined")
}


function updateObjectDetectionState() {
    if (DisableDetectionStates) {
        return
    }
    
    resetReinforcements()
    if (objectWasDetected) {
        if (detectedObjectClass === CupClass) {
            doNegativeReinforcement()
        }
        else if (detectedObjectClass === BottleClass) {
            doPositiveReinforcement()
        }
    }

    if (script.pointerObjectTrackingHint) {
        script.pointerObjectTrackingHint.enabled = !isObjectDetectionOn
    }
    else {
        print("script.pointerObjectTrackingHint undefined")
    }  
}

function onFrameUpdateEvent(e) {
    if (script.onPointerEventScript === undefined) {
        print("onPointerEventScript is undefined")
        return
    }
    
    if (script.onPointerEventScript.api.isPointing) {
        if (!isPointing) {
            print("Setting isPointing = true")
        }
        isPointing = true
        isObjectDetectionOn = true
        pointEndEventDelayRemaining = PointEndEventDelay
    }
    else if (pointEndEventDelayRemaining > 0) {
        pointEndEventDelayRemaining -= getDeltaTime()
        if (pointEndEventDelayRemaining <= 0) {
            print("point end delay expired")
            print("Setting isPointing = false")
            isPointing = false
        }
    }
    
    if (objectWasDetected || isPointing) {
        isObjectDetectionOn = true
        objectDetectEndEventDelayRemaining = ObjectDetectionEndEventDelay
    }
    else if (objectDetectEndEventDelayRemaining > 0) {
        objectDetectEndEventDelayRemaining -= getDeltaTime()
        if (objectDetectEndEventDelayRemaining <= 0) {
            print("object detection delay expired")
            isObjectDetectionOn = false
            objectWasDetected = false
        }
    }
    
    updateObjectDetectionState()
}

var frameUpdateEvent = script.createEvent("UpdateEvent")
frameUpdateEvent.bind(onFrameUpdateEvent)


function onDetectionsUpdated(results) {
    if (!isPointing && !isObjectDetectionOn) {
        return
    }
//    print("isObjectDetectionOn = " + isObjectDetectionOn)
    print("Doing object detection handling ...")
    
    var isObjectDetected = false
    
//    print("onDetectionsUpdated called")
    var resultsKeys = Object.keys(results)
//    print("resultsKeys count = " + resultsKeys.length)
//    print("resultsKeys = " + resultsKeys)
    
    for (var i = 0; i < resultsKeys.length; i += 1) {
        var result = results[i]
        if (result) {
            print(i + ": box = " + result.box)
            print("   score = " + result.score)
            print("   class = " + result.class)
            isObjectDetected = true;
            detectedObjectClass = result.class
        }
        else {
            isObjectDetected = false
//            print(i + ": undefined")
        }
    }
    
    objectWasDetected = isObjectDetected
}

if (script.mlOutputDecoderScript && script.mlOutputDecoderScript.api.addCallback) {
    script.mlOutputDecoderScript.api.addCallback(onDetectionsUpdated)
}
