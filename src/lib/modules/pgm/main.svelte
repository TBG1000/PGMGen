<div class="card mb-3">
  <div class="card-header">PGM Specifications</div>
  <div class="card-body">
    <div class="form-floating mb-3">
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="xmldeclareChecked">
        <label class="form-check-label" for="xmldeclareChecked">Include XML declaration tag</label>
      </div>
    </div>
    <div class="form-floating">
      <select class="form-select" id="mapProto">
          <option value="1" selected>1.4.2 (recommended)</option>
          <option value="2">1.4.1</option>
          <option value="3">1.4.0</option>
          <!-- <option value="4">1.3.6</option>
          <option value="5">1.3.5</option>
          <option value="6">1.3.4</option>
          <option value="7">1.3.3</option>
          <option value="8">1.3.2</option>
          <option value="9">1.3.1</option> -->
        </select>
        <label for="mapProto">Protocol Version</label>
    </div>
  </div>
</div>
<div class="card mb-3">
  <div class="card-header">Map Details</div>
  <div class="card-body">
    <div class="form-floating mb-3">
      <input type="text" class="form-control" id="mapName" placeholder=" " required>
      <label for="mapName">Map Name</label>
     </div>
     <div class="form-floating mb-3">
      <input type="text" class="form-control" id="mapVersion" placeholder="1.0.0">
      <label for="mapVersion">Map Version</label>
     </div>
     <div class="form-floating mb-3">
      <input type="text" class="form-control" id="mapCreationDate" placeholder="YYYY-MM-DD">
      <label for="mapCreationDate">Map Creation Date</label>
     </div>
     <div class="input-group mb-3">
      <div class="form-floating flex-grow-1">
        <select class="form-select rounded-0 rounded-start" id="mapPhase">
          <option value="1" selected>-</option>
          <option value="2">Production (default)</option>
          <option value="3">Development</option>
        </select>
        <label for="mapPhase">Map Phase</label>
      </div>
      <div class="form-floating flex-grow-1">
        <select class="form-select rounded-0 rounded-end" id="mapEdition">
          <option value="0" selected>-</option>
          <option value="1">Standard (default)</option>
          <option value="2">Ranked</option>
          <option value="3">Tournament</option>
        </select>
        <label for="mapEdition">Map Edition</label>
      </div>
    </div>
     <div class="form-floating">
      <textarea class="form-control" style="height: 80px" placeholder=" " id="mapDescription"></textarea>
      <label for="mapDescription">Map Objective</label>
     </div>
</div>
</div>
 <div class="card mb-3">
  <div class="card-header">Map Gamemode(s)</div>
  <div class="card-body">
    <div class="mb-3">
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isAttackDefend">
        <label class="form-check-label" for="isAttackDefend">Attack/Defend</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isArcade">
        <label class="form-check-label" for="isArcade">Arcade</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isBedwars">
        <label class="form-check-label" for="isBedwars">Bed Wars</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isBlitz">
        <label class="form-check-label" for="isBlitz">Blitz</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isBlitzRage">
        <label class="form-check-label" for="isBlitzRage">Blitz: Rage</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isBridge">
        <label class="form-check-label" for="isBridge">Bridge</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isCP">
        <label class="form-check-label" for="isCP">Control the Point (CP)</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isCTF">
        <label class="form-check-label" for="isCTF">Capture the Flag (CTF)</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isCTW">
        <label class="form-check-label" for="isCTW">Capture the Wool (CTW)</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isDTC">
        <label class="form-check-label" for="isDTC">Destroy the Core (DTC)</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isDTM">
        <label class="form-check-label" for="isDTM">Destroy the Monument (DTM)</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isFFA">
        <label class="form-check-label" for="isFFA">Free for All (FFA)</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isFFB">
        <label class="form-check-label" for="isFFB">Flag Football (FFB)</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isKOTF">
        <label class="form-check-label" for="isKOTF">King of the Flag (KoTF)</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isKOTH">
        <label class="form-check-label" for="isKOTH">King of the Hill (KoTH)</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isMixed">
        <label class="form-check-label" for="isMixed">Mixed</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isPayload">
        <label class="form-check-label" for="isPayload">Payload</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isRage">
        <label class="form-check-label" for="isRage">Rage</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isRFW">
        <label class="form-check-label" for="isRFW">Race for Wool</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isScorebox">
        <label class="form-check-label" for="isScorebox">Scorebox</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isSkywars">
        <label class="form-check-label" for="isSkywars">Skywars</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isSG">
        <label class="form-check-label" for="isSG">Survival Games</label>
      </div>
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" value="" id="isTDM">
        <label class="form-check-label" for="isTDM">Team Deathmatch (TDM)</label>
      </div>
    </div>
    <div class="form-floating">
      <input type="text" class="form-control" id="gameTitle" placeholder=" " title="Specify a custom title for a custom gamemode instead of using PGM auto-generated titles.">
      <label for="gameTitle">Game Title</label>
    </div>
  </div>
</div>
