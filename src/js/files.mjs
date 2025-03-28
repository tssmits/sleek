"use strict";
import { appData, userData, getUserData, setUserData, translations } from "../render.js";
import { _paq } from "./matomo.mjs";
import { createModalJail } from "./jail.mjs";
import { resetFilters } from "./filters.mjs";
import { showOnboarding } from "./onboarding.mjs";
import { resetModal, handleError } from "./helper.mjs";
import { focusRow } from "./keyboard.mjs";

const btnOpenTodoFile = document.getElementById("btnOpenTodoFile");
const modalChangeFileTable = document.getElementById("modalChangeFileTable");
const fileTabBarList = document.querySelector("#fileTabBar ul");
const fileTabBar = document.getElementById("fileTabBar");
const modalChangeFile = document.getElementById("modalChangeFile");
const modalChangeFileCreate = document.getElementById("modalChangeFileCreate");
const modalChangeFileOpen = document.getElementById("modalChangeFileOpen");

modalChangeFileCreate.innerHTML = translations.createFile;
modalChangeFileOpen.innerHTML = translations.openFile;

function removeFileFromList(index, isTabItem) {
  try {
    if(isTabItem) {
      let newItemIndex;
      userData.files[index][0] = 0;
      userData.files[index][2] = 0;
      newItemIndex = userData.files.findIndex(file => {
        return file[2] === 1;
      });
      if(newItemIndex >= 0) {
        userData.files[newItemIndex][0] = 1;
        userData.files[newItemIndex][2] = 1;
        resetFilters(true).then(function(response) {
          console.log(response);
          setUserData("files", userData.files);
          window.api.send("startFileWatcher", [userData.files[newItemIndex][1], 1]);
        }).catch(function(error) {
          handleError(error);
        });
      } else {
        userData.files[index][0] = 0;
        userData.files[index][2] = 0;
        setUserData("files", userData.files);
        if(userData.files.length>0) generateFileList();
        showOnboarding(true);
      }
    } else {
      if(userData.files[index][0]) {
        showOnboarding(true);
      }
      userData.files.splice(index, 1);
      setUserData("files", userData.files);
    }
    return Promise.resolve("Success: File removed from list");
  } catch (error) {
    return Promise.reject(error);
  }
}

function selectFileFromList(index) {
  try {
    resetFilters(false).then(function(response) {
      console.info(response);
    }).catch(function(error) {
      handleError(error);
    });
    resetModal().then(response => {
      console.info(response);
    }).catch(error => {
      handleError(error);
    });
    // throw false at this function and current row will be reset
    focusRow(false);
    // load new file
    window.api.send("startFileWatcher", [userData.files[index][1], 1]);
    return Promise.resolve("Success: File selected");
  } catch (error) {
    return Promise.reject(error);
  }
}

async function generateFileList() {
  try {
    fileTabBar.classList.remove("is-active");
    fileTabBarList.innerHTML = null;
    modalChangeFileTable.innerHTML = null;
    modalChangeFileTable.classList.add("files");
    let j = 0;
    for (let i = 0; i < userData.files.length; i++) {
      let isActive = userData.files[i][0];
      let isTabItem = userData.files[i][2];
      if(isTabItem) {
        j++;
        let fileName = userData.files[i][1].split("/").pop();
        if(j > 1 && userData.fileTabs) fileTabBar.classList.add("is-active");
        if(appData.os === "windows") fileName = userData.files[i][1].split("\\").pop();
        let listItem = document.createElement("li");
        listItem.setAttribute("title", userData.files[i][1]);
        listItem.innerHTML = fileName;
        listItem.innerHTML += "<i class=\"fas fa-times\"></i>";
        if(isActive===1) listItem.classList.add("is-highlighted");
        listItem.querySelector("i").onclick = function() {
          removeFileFromList(i, isTabItem);
          // trigger matomo event
          if(userData.matomoEvents) _paq.push(["trackEvent", "File-Tab", "Click on remove icon"]);
        }
        if(!isActive) {
          listItem.onclick = function(event) {
            if(event.target.classList.contains("fas")) return false;
            selectFileFromList(i).then(function(response) {
              console.info(response);
            }).catch(function(error) {
              handleError(error);
            });
            // trigger matomo event
            if(userData.matomoEvents) _paq.push(["trackEvent", "File-Tab", "Click on tab"]);
          }
        }
        fileTabBarList.appendChild(listItem);
      }
      let row = modalChangeFileTable.insertRow(-1);
      let cell1 = row.insertCell(0);
      let cell2 = row.insertCell(1);
      let cell3 = row.insertCell(2);
      if(userData.files[i][0]===1) {
        cell1.innerHTML = "<button disabled>" + translations.selected + "</button>";
      } else {
        cell1.innerHTML = "<button tabindex=\"0\">" + translations.select + "</button>";
        cell1.onclick = function() {
          selectFileFromList(i).then(function(response) {
            console.info(response);
          }).catch(function(error) {
            handleError(error);
          });
          // trigger matomo event
          if(userData.matomoEvents) _paq.push(["trackEvent", "File-Chooser", "Click on select button"]);
        }
      }
      cell2.innerHTML = userData.files[i][1];
      cell3.innerHTML = "<a href=\"#\" tabindex=\"0\"><i class=\"fas fa-minus-circle\"></i></a>";
      cell3.title = translations.delete;
      cell3.onclick = function() {
        removeFileFromList(i);
        generateFileList().then(response => {
          modalChangeFile.classList.add("is-active");
          modalChangeFile.focus();
          console.info(response);
        }).catch(error => {
          handleError(error);
        });
        // trigger matomo event
        if(userData.matomoEvents) _paq.push(["trackEvent", "File-Chooser", "Click on remove button"]);
      }
    }
    return Promise.resolve("Success: File changer modal built and opened");
  } catch (error) {
    return Promise.reject(error);
  }
}
btnOpenTodoFile.onclick = function() {
  if(typeof userData.files === "object" && userData.files.length>0) {
    generateFileList().then(response => {
      console.info(response);
      modalChangeFile.classList.add("is-active");
      modalChangeFile.focus();
      createModalJail(modalChangeFile);
    }).catch(error => {
      handleError(error);
    });
  } else {
    window.api.send("openOrCreateFile", "open");
  }
  // trigger matomo event
  if(userData.matomoEvents) _paq.push(["trackEvent", "Menu", "Click on Files"]);
}

export { generateFileList, removeFileFromList };
