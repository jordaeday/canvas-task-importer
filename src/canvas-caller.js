export { getAllData, generateOutput };

async function getAllData(url, token) {

    // check if the arguments are valid
    if (!url) {
        return "Erorr: URL is not defined";
    }
    if (!token) {
        return "Error: Token is not defined";
    }

    // json object to store the data
    const data = {
        courses: []
    };

    const courseData = await getCourseData(url, token);

    for (let i = 0; i < courseData.length; i++) {
        // add to data object
        data.courses.push({
            name: courseData[i].name,
            id: courseData[i].id,
            modules: []
        });
    }

    // loop over each course id
    for (let i = 0; i < courseData.length; i++) {
        // filter out courses that have a status of "unauthorized" (i.e. the course is not published yet)
        if (courseData[i].name == undefined) {
            //course is not published yet or otherwise not accessible
            continue;
        }

        const courseId = courseData[i].id;
        const courseModules = await getCourseModules(url, token, courseId);

        // add modules to data object
        for (let j = 0; j < courseModules.length; j++) {
            data.courses[i].modules.push({
                name: courseModules[j].name,
                id: courseModules[j].id,
                assignments: []
            });
        }
        
        // loop over each module
        for (let j = 0; j < courseModules.length; j++) {
            const module = courseModules[j];

            // get assignments for each module
            const assignments = await getAssignments(url, token, courseId, module.id);
            // loop over each assignment
            for (let k = 0; k < assignments.length; k++) {
                const assignment = assignments[k];
                
                // get the assignment details
                if (assignment.url == undefined) {
                    continue;
                }
                const assignmentDetails = await getAssignmentDetails(assignment.url, token);

                // add assignments to data object
                data.courses[i].modules[j].assignments.push({
                    name: assignmentDetails.name,
                    data: assignmentDetails
                });

            }
        }
    }

    return data;
}

async function getCourseData(url, token) {
    const courseUrl = url + "/api/v1/courses?access_token=" + token;

    try {
        const req = await requestUrl(courseUrl);
        return await req.json;
    } catch (err) {
        return `Error: Error fetching course data from ${url}`;
    }
}

async function getCourseModules(url, token, courseId) {
    const courseModuleUrl = url + "/api/v1/courses/" + courseId + "/modules?page=1&per_page=10&access_token=" + token;
    
    let data = [];
    let nextUrl = courseModuleUrl;
    let page = 1;

    // loop through all pages of modules
    while (nextUrl) {
        const req = await requestUrl(nextUrl);
        data.push(...req.json);

        if (req.headers.link == null) {
            nextUrl = null;
            continue;
        }
        const headers = req.headers.link.split(",");
        // if headers has "rel=next" then get the next url
        if (headers[1].includes("rel=\"next\"")){
            // increase page value
            page++;
            nextUrl = url + "/api/v1/courses/" + courseId + "/modules?page=" + page + "&per_page=10&access_token=" + token;
        } else {
            nextUrl = null;
        }
    }

    return data;
}

async function getAssignments(url, token, courseId, moduleId) {
    const assignmentUrl = url + "/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items?access_token=" + token;

    try {
        const req = await requestUrl(assignmentUrl);
        return await req.json;
    } catch (err) {
        return `Error: Error fetching assignments from ${url + "/api/v1/courses/" + courseId + "/modules/" + moduleId}`;
    }
}

async function getAssignmentDetails(url, token) {
    const assignmentDetailUrl = url + "?access_token=" + token;

    try {
        const req = await requestUrl(assignmentDetailUrl);
        return await req.json;
    } catch (err) { 
        return `Error: Error fetching details of assignment ${url}`;
    }
}

// formats the data object so that an obsidian-friendly markdown file can be generated
async function generateOutput(url, token) {

    let output = "";
    const data = await getAllData(url, token);

    for (let i = 0; i < data.courses.length; i++) {
        if (data.courses[i].name == undefined) {
            continue;
        }
        output += "# " + data.courses[i].name + "\n";
        for (let j = 0; j < data.courses[i].modules.length; j++) {
            output += "## " + data.courses[i].modules[j].name + "\n";
            for (let k = 0; k < data.courses[i].modules[j].assignments.length; k++) {
                if (data.courses[i].modules[j].assignments[k].name == undefined) {
                    continue;
                }
                if (data.courses[i].modules[j].assignments[k].data.due_at == undefined) {
                    continue;
                }
                output += "- [ ] " + data.courses[i].modules[j].assignments[k].name + " 📅 " + data.courses[i].modules[j].assignments[k].data.due_at;
                output += "\n";
            }
        }
    }

    return output;
}