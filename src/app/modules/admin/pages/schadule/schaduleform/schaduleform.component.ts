import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { classroom } from 'src/app/data/classroom';
import { teacher } from 'src/app/data/teacher';
import { ClassroomService } from 'src/app/services/classroom.service';
import { HostmanagerService } from 'src/app/services/hostmanager.service';
import { SchaduleSessionService } from 'src/app/services/schadule.session.service';
import { TeacherService } from 'src/app/services/teacher.service';

@Component({
  selector: 'app-schaduleform',
  templateUrl: './schaduleform.component.html',
  styleUrls: ['./schaduleform.component.css','../../form.style.css']
})
export class SchaduleformComponent implements OnInit,OnDestroy {
  classrooms:classroom[]=[];
  teachers:teacher[]=[];
  schaduleitem:any;
  subject:string='';
  data:any='';
  hostSubscriber:any
  schadule:FormGroup=new FormGroup({
    day:new FormControl('',[Validators.required]) ,
    classId:new FormControl('',[Validators.required]) ,
    sessionNo:new FormControl('',[Validators.required,Validators.pattern("[1-9]{1,}")]) ,
    teacherID:new FormControl('',[Validators.required]) 
  })
  constructor(private schaduleservice:SchaduleSessionService,private classroomservice:ClassroomService,private teacherservice:TeacherService,private hostman:HostmanagerService){}
  ngOnDestroy(): void {
    this.hostSubscriber.unsubscribe()
  }
  ngOnInit(): void {
    let teacherSubscriber=this.teacherservice.getall().subscribe({
      next:res=>{
        this.teachers=res
        teacherSubscriber.unsubscribe()
      }
    });
    this.hostSubscriber=this.hostman.data.subscribe({
      next:res=>{
        if(res.data!=''){
          this.daycontrol.setValue(res.data.session.scheduleDay );
          this.classcontrol.setValue(res.data.classid+'');
          this.sessionNocontrol.setValue(res.data.session.sessionNo);
          this.teachercontrol.setValue(res.data.session.teacherID);
          this.subject=res.data.session.subjectName; 
          this.data=res.data;
        }
        
      }
    })
  }
  get daycontrol(){
    return this.schadule.controls['day']
  }
  get classcontrol(){
    return this.schadule.controls['classId']
  }
  get sessionNocontrol(){
    return this.schadule.controls['sessionNo']
  }
  get teachercontrol(){
    return this.schadule.controls['teacherID']
  }
  setsubjectAndclass(){
    let teacher=this.teachers.find(p=>p.Id==this.teachercontrol.value);
    this.subject=teacher?.SubjectName||'';
    let subjectid=teacher?.SubjectId
    if(subjectid){
      this.classroomservice.getallbysubject(subjectid).subscribe({
        next:res=>{
          this.classrooms=res;
        }
      })
    }

  }
  close(){
    this.hostman.load({open:false,data:'',returndata:'',type:''});
  }
  addschadule(){
    if(this.schadule.valid){
      let teacher=this.teachers[this.teachers.findIndex(p=>p.Id==this.schadule.value.teacherID)];
      if(this.data){
        let session={
          id: this.data.session.id,
          sessionNo: this.sessionNocontrol.value,
          scheduleID: this.data.session.scheduleID,
          teacherID: teacher.Id,
          subjectName: teacher.SubjectName,
          teacherName: teacher.FullName,
          scheduleDay: this.schadule.value.day
      }
      let schadule={
        id:  this.data.session.scheduleID,
        day: this.schadule.value.day,
        classId:+this.schadule.value.classId,
        classRoomName: this.classrooms[this.classrooms.findIndex(p=>p.id==this.schadule.value.classId)].name
      }
        this.schaduleservice.updateschadule(schadule).subscribe({
          next:res=>{
            this.schaduleservice.updatesession(session).subscribe({
              next:res=>{
                this.hostman.load({open:false,data:'',returndata:res,type:''})
              }
            })
          }
        })
      }
      else{
        let schadule={
          Day:this.schadule.value.day,
          classId:+this.schadule.value.classId,
          ClassRoom:this.classrooms[this.classrooms.findIndex(p=>p.id==this.schadule.value.classId)].name,
          Teacherid:this.schadule.value.teacherID,
          Teacher:teacher.FullName,
          Subject:teacher.SubjectName,
          SessionNum:this.schadule.value.sessionNo,
          gradeyear:this.classrooms[this.classrooms.findIndex(p=>p.id==this.schadule.value.classId)].gradeYearName
        }
        this.schaduleitem=schadule;
      }
    }
  }
  validatedate($event:any){
    let today=new Date().toISOString();
    console.log(today)
    console.log($event.target.value)
    if($event.target.value>today){
      this.daycontrol.setErrors({
      ...this.daycontrol.errors,
      'notvalid':null
    })
    this.daycontrol.updateValueAndValidity(); 
  }
  else{
    this.daycontrol.setErrors({'notvalid':true})
  }
  }
}
