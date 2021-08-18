import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HabitacionService } from '../habitacion.service';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';


export interface FILE {
  name: string;
  filepath: string;
  size: number;
}
@Component({
  selector: 'app-crear',
  templateUrl: './crear.page.html',
  styleUrls: ['./crear.page.scss'],
})
export class CrearPage implements OnInit {

  formCrear: FormGroup;
  ngFireUploadTask: AngularFireUploadTask;
  progressNum: Observable<number>;
  progressSnapshot: Observable<any>;
  fileUploadedPath: Observable<string>;
  files: Observable<FILE[]>;
  fileName: string;
  fileSize: number;
  isImgUploading: boolean;
  isImgUploaded: boolean;
  private ngFirestoreCollection: AngularFirestoreCollection<FILE>;

  constructor(
    private angularFirestore: AngularFirestore,
    private angularFireStorage: AngularFireStorage,
    private habitacionServicio: HabitacionService,
    private router: Router
  ) {
    this.isImgUploading = false;
    this.isImgUploaded = false;
    this.ngFirestoreCollection = angularFirestore.collection<FILE>('filesCollection');
    this.files = this.ngFirestoreCollection.valueChanges();
  }

    fileUpload(event: FileList) {
      const file = event.item(0);
      if (file.type.split('/')[0] !== 'image') {
        console.log('File type is not supported!');
        return;
      }
      this.isImgUploading = true;
      this.isImgUploaded = false;
      this.fileName = file.name;
      const fileStoragePath = `filesStorage/${new Date().getTime()}_${file.name}`;
      const imageRef = this.angularFireStorage.ref(fileStoragePath);
      this.ngFireUploadTask = this.angularFireStorage.upload(fileStoragePath, file);
      this.progressNum = this.ngFireUploadTask.percentageChanges();
      this.progressSnapshot = this.ngFireUploadTask.snapshotChanges().pipe(
        finalize(() => {
          this.fileUploadedPath = imageRef.getDownloadURL();
          this.fileUploadedPath.subscribe(resp=>{
            this.fileStorage({
              name: file.name,
              filepath: resp,
              size: this.fileSize
            });
            this.isImgUploading = false;
            this.isImgUploaded = true;
          },error => {
            console.log(error);
          });
        }),
        tap(snap => {
            this.fileSize = snap.totalBytes;
        })
      );
  }


  fileStorage(image: FILE) {
      const imgId = this.angularFirestore.createId();
      this.ngFirestoreCollection.doc(imgId).set(image).then(data => {
        console.log(data);
      }).catch(error => {
        console.log(error);
      });
  }

  ngOnInit() {
    this.formCrear = new FormGroup({

      ubicacion: new FormControl(null, {
        updateOn: 'blur',
        validators:[Validators.required]
      }),
      estado: new FormControl(null, {
        updateOn: 'blur',
        validators:[Validators.required]
      }),
      categoria: new FormControl(null, {
        updateOn: 'blur',
        validators:[Validators.required]
      }),
      descripcion: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      img: new FormControl(null, {
        validators: [Validators.required]
      })
    });
  }

  addFunction(){
    if(!this.formCrear.valid){
      return;
    }
    console.log(this.formCrear);
    this.habitacionServicio.addHabitacion(
      this.formCrear.value.id,
      this.formCrear.value.ubicacion,
      this.formCrear.value.estado,
      this.formCrear.value.categoria,
      this.formCrear.value.descripcion,
      this.formCrear.value.img,
      this.formCrear.value.uri,
    );
    this.router.navigate(['/habitacion']);
  }

}
